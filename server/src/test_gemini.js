import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('No GEMINI_API_KEY found');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    console.log('Testing gemini-1.5-flash...');
    const model1 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const res1 = await model1.generateContent('Say hello');
    console.log('gemini-1.5-flash success:', res1.response.text());
  } catch (e) {
    console.error('gemini-1.5-flash failed:', e.message);
  }

  try {
    console.log('Testing gemini-3.6-flash...');
    const model2 = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const res2 = await model2.generateContent('Say hello');
    console.log('gemini-3.6-flash success:', res2.response.text());
  } catch (e) {
    console.error('gemini-3.6-flash failed:', e.message);
  }
}

test();
