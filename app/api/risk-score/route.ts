import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, description, buyerAddress, supplierAddress } = await request.json();
    
    if (!amount || !buyerAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const prompt = `
You are an AI Risk Assessment engine for an on-chain invoice factoring protocol.
Your task is to assign a risk tier (A, B, or C) to an invoice based on its parameters.

Parameters:
- Invoice Amount: ${amount} XLM
- Invoice Description: ${description || 'None'}
- Buyer Address: ${buyerAddress}
- Supplier Address: ${supplierAddress || 'Unknown'}

Rules:
- Tier A: Low risk (e.g., standard amounts, reliable-looking addresses, clear descriptions).
- Tier B: Medium risk (e.g., higher amounts or slightly vague descriptions).
- Tier C: High risk (e.g., unusually large amounts, suspicious descriptions, or known risky patterns).

Analyze the risk and return ONLY the letter A, B, or C. No other text.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content?.trim()?.toUpperCase() || '';
    
    // Fallback if AI gets chatty
    let tier = 'B';
    if (resultText.includes('A')) tier = 'A';
    else if (resultText.includes('C')) tier = 'C';

    return NextResponse.json({ tier });
  } catch (error) {
    console.error('AI Risk Scoring error:', error);
    // Fallback to B on error
    return NextResponse.json({ tier: 'B' });
  }
}
