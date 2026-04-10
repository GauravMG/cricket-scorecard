import axios from 'axios';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Mozilla/5.0 (X11; Linux x86_64)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function smartFetch(url: string) {
  await new Promise(res => setTimeout(res, Math.random() * 3000 + 1000));

  const response = await axios.get(url, {
    headers: {
      'User-Agent': randomUA(),
      'Accept': 'application/json',
      'Referer': 'https://www.cricbuzz.com/'
    }
  });

  return response.data;
}