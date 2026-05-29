import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, markdown } = req.body;
    if (!markdown) return res.status(400).json({ error: 'Missing markdown' });

    const lines = markdown.split('\n');
    const children = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        children.push(new Paragraph({
          text: trimmed.replace(/^#+\s*/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
        }));
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        children.push(new Paragraph({
          children: [new TextRun({ text: '• ' + trimmed.replace(/^[-*]\s*/, ''), size: 24 })],
          spacing: { after: 80 },
          indent: { left: 360 },
        }));
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: trimmed, size: 24 })],
          spacing: { after: 100 },
        }));
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title || 'Summary',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
          }),
          ...children
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${(title || 'summary').replace(/[^a-z0-9]/gi, '-')}.docx"`);
    res.send(buffer);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
