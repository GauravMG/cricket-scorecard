export function liveScoreHTML(data: any) {
  return `
  <html>
  <body style="background:black;color:white;font-size:30px">
    <h1>${data.matchHeader?.name}</h1>
    <h2>${data.miniscore?.score}</h2>
  </body>
  </html>`;
}

export function scorecardHTML(data: any) {
  return `
  <html>
  <body style="background:black;color:white">
    <h1>Scorecard</h1>
    <pre>${JSON.stringify(data.scoreCard, null, 2)}</pre>
  </body>
  </html>`;
}