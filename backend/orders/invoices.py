import os
from io import BytesIO
from xml.sax.saxutils import escape

import reportlab
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def build_invoice_pdf(order):
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f'Invoice {order.reference}',
        author='Legacy Coffee',
    )
    styles = getSampleStyleSheet()
    font_directory = os.path.join(os.path.dirname(reportlab.__file__), 'fonts')
    regular_font = 'LegacyInvoice'
    bold_font = 'LegacyInvoice-Bold'
    if regular_font not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(regular_font, os.path.join(font_directory, 'Vera.ttf')))
        pdfmetrics.registerFont(TTFont(bold_font, os.path.join(font_directory, 'VeraBd.ttf')))
        pdfmetrics.registerFontFamily(
            regular_font,
            normal=regular_font,
            bold=bold_font,
            italic=regular_font,
            boldItalic=bold_font,
        )
    styles['Normal'].fontName = regular_font
    styles['Normal'].fontSize = 9
    styles['Normal'].leading = 13
    styles.add(ParagraphStyle(
        'InvoiceMeta',
        parent=styles['Normal'],
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#555555'),
    ))
    styles.add(ParagraphStyle(
        'InvoiceSmall',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#555555'),
    ))

    def paragraph(value, style='Normal', markup=False):
        content = str(value) if markup else escape(str(value))
        return Paragraph(content.replace('\n', '<br/>'), styles[style])

    item_rows = [[
        paragraph('<b>Product</b>', markup=True),
        paragraph('<b>Unit price</b>', markup=True),
        paragraph('<b>Qty</b>', markup=True),
        paragraph('<b>Amount</b>', markup=True),
    ]]
    for item in order.items.all():
        product = f'{item.product_name} ({item.weight})'
        if item.is_wholesale:
            product += ' — wholesale'
        item_rows.append([
            paragraph(product),
            paragraph(f'UGX {item.unit_price:,.0f}'),
            paragraph(item.quantity),
            paragraph(f'UGX {item.line_total:,.0f}'),
        ])

    item_table = Table(item_rows, colWidths=(86 * mm, 34 * mm, 18 * mm, 34 * mm), repeatRows=1)
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f4e9de')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#4b2e20')),
        ('FONTNAME', (0, 0), (-1, 0), bold_font),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bd8d69')),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    customer_lines = [order.customer_name]
    if order.business_name:
        customer_lines.append(order.business_name)
    customer_lines.extend([order.customer_email, order.customer_phone])
    customer_lines.append(f'{order.delivery_address}, {order.delivery_city}')

    invoice_date = timezone.localtime(order.created_at).strftime('%d %b %Y, %H:%M (EAT)')
    logo = Image(
        os.path.join(os.path.dirname(__file__), 'assets', 'legacy-coffee-logo.png'),
        width=48 * mm,
        height=48 * mm,
    )
    story = [
        Table(
            [[logo, paragraph(
                f'<b>INVOICE</b><br/>Order {escape(order.reference)}<br/>'
                f'{escape(invoice_date)}',
                'InvoiceMeta',
                markup=True,
            )]],
            colWidths=(90 * mm, 82 * mm),
            style=TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]),
        ),
        Spacer(1, 12 * mm),
        paragraph('<b>Bill to</b>', markup=True),
        paragraph('<br/>'.join(escape(value) for value in customer_lines), markup=True),
        Spacer(1, 9 * mm),
        item_table,
        Spacer(1, 6 * mm),
        Table(
            [[paragraph('<b>Order total</b>', markup=True), paragraph(
                f'<b>UGX {order.total:,.0f}</b>',
                markup=True,
            )]],
            colWidths=(130 * mm, 42 * mm),
            style=TableStyle([
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
                ('LINEABOVE', (0, 0), (-1, 0), 0.8, colors.HexColor('#bd8d69')),
                ('TOPPADDING', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]),
        ),
        Spacer(1, 7 * mm),
        paragraph(
            'This document confirms receipt of your order request and is not a final invoice or proof of payment. '
            'No payment has been collected at this stage. Our team will review your order and confirm the delivery '
            'charges, availability, and final order details before proceeding. Any payment instructions will be '
            'provided once your order has been confirmed.',
            'InvoiceSmall',
        ),
    ]
    document.build(story)
    return buffer.getvalue()
