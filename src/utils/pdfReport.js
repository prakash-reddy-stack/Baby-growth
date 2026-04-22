import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

export const generateAndShareReport = async (baby, feedings, growthRecords, vaccinations) => {
  const now = format(new Date(), 'dd MMM yyyy');
  const dob = baby?.dob ? format(new Date(baby.dob), 'dd MMM yyyy') : '-';

  const feedingRows = feedings.slice(0, 30).map(f => `
    <tr>
      <td>${format(new Date(f.logged_at), 'dd MMM yyyy HH:mm')}</td>
      <td>${f.type === 'breastfeed' ? 'Breastfeed' : 'Formula'}</td>
      <td>${f.amount_ml ? f.amount_ml + ' ml' : '-'}</td>
      <td>${f.duration_min ? f.duration_min + ' min' : '-'}</td>
    </tr>`).join('');

  const growthRows = growthRecords.map(g => `
    <tr>
      <td>${format(new Date(g.recorded_at), 'dd MMM yyyy')}</td>
      <td>${g.weight_kg ? g.weight_kg + ' kg' : '-'}</td>
      <td>${g.height_cm ? g.height_cm + ' cm' : '-'}</td>
      <td>${g.head_cm ? g.head_cm + ' cm' : '-'}</td>
    </tr>`).join('');

  const vaccineRows = vaccinations.map(v => `
    <tr>
      <td>${v.vaccine_name}</td>
      <td>${v.administered_at ? format(new Date(v.administered_at), 'dd MMM yyyy') : 'Pending'}</td>
      <td>${v.location || '-'}</td>
    </tr>`).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { font-family: Arial, sans-serif; color: #3D2C35; padding: 24px; }
        h1 { color: #E07A96; font-size: 24px; margin-bottom: 4px; }
        h2 { color: #E07A96; font-size: 16px; margin-top: 24px; border-bottom: 2px solid #F4A7B9; padding-bottom: 4px; }
        .meta { color: #8A7480; font-size: 13px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #F4A7B9; color: white; padding: 8px; text-align: left; }
        td { padding: 7px 8px; border-bottom: 1px solid #F0E0E6; }
        tr:nth-child(even) { background: #FFF0F5; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
        .done { background: #B5EAD7; color: #2D6A4F; }
        .pending { background: #FFE5A0; color: #7D5A00; }
      </style>
    </head>
    <body>
      <h1>Baby Health Report — ${baby?.name || 'Baby'}</h1>
      <div class="meta">Date of Birth: ${dob} &nbsp;|&nbsp; Report generated: ${now}</div>

      <h2>Feeding Log (last 30 entries)</h2>
      <table>
        <thead><tr><th>Date & Time</th><th>Type</th><th>Amount</th><th>Duration</th></tr></thead>
        <tbody>${feedingRows || '<tr><td colspan="4">No records</td></tr>'}</tbody>
      </table>

      <h2>Growth Records</h2>
      <table>
        <thead><tr><th>Date</th><th>Weight</th><th>Height</th><th>Head Circ.</th></tr></thead>
        <tbody>${growthRows || '<tr><td colspan="4">No records</td></tr>'}</tbody>
      </table>

      <h2>Vaccination Records</h2>
      <table>
        <thead><tr><th>Vaccine</th><th>Date Given</th><th>Location</th></tr></thead>
        <tbody>${vaccineRows || '<tr><td colspan="3">No records</td></tr>'}</tbody>
      </table>
    </body>
    </html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${baby?.name || 'Baby'} Health Report`,
    });
  }

  return uri;
};
