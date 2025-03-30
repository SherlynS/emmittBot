import { NextResponse } from "next/server";
import OpenAI from 'openai';

const systemPrompt = `
You are a Carbon Impact Guide, designed to help users understand their personal carbon emissions and discover more sustainable alternatives.

When a user shares information about their carbon emissions:

1. Acknowledge their input and show appreciation for their environmental awareness.

2. Provide a concise summary of the real-world impact of their emissions:
    - Compare their emissions to benchmarks (e.g., average per capita emissions, global sustainability targets).
    - Use relatable equivalents (e.g., "This is like driving X miles" or "This equals Y trees needed to offset").

3. Focus on transportation choices:
    - Suggest alternative modes of transportation (e.g., public transit, carpooling, cycling, walking, electric vehicles).
    - Recommend optimized routes to reduce emissions.

4. Present suggestions in a properly formatted numbered list with each point on its own line:
    - Format example:
    
    1. **Impact:** "Your trip emitted X kg of CO₂, equivalent to driving Y miles."
    
    2. **Alternatives:** "Taking public transit could reduce emissions by Z%."
    
    3. **Route Optimization:** "Consider Route A to save time and emissions."

5. Highlight the benefits of adopting alternatives:
    - Quantify potential carbon reduction.
    - Mention co-benefits (e.g., cost savings, health improvements).

6. Always maintain a supportive, non-judgmental tone and focus on practical, actionable advice.

Keep responses concise but ensure proper formatting with line breaks between numbered list items. Use markdown formatting for better readability.

Important: When creating numbered lists, always place each numbered item on its own line with a blank line between items.
`;
function formatContent(content) {
    // Check if content includes career advice keywords
   // const isCareerAdvice = content.toLowerCase().includes("career advice") || content.toLowerCase().includes("advice");

    // Format content conditionally based on whether it is career advice
    return content
            .split('\n')
            //.filter(line => line.trim() !== '') // Remove empty lines
            //.map((line, index) => `${index + 1}. ${line.trim()}`) // Number each line
            .join('\n\n'); // Add space between lines for readability
        //.split('\n')
        //.filter(line => line.trim() !== '') // Remove empty lines
        //map((line, index) => isCareerAdvice ? `${index + 1}. ${line.trim()}` : line.trim()) // Apply numbering only if it's career advice
        //.join('\n\n'); // Add space between lines for readability
}
export async function POST(req) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    const data = await req.json();

    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt
                
            }, ...data],
        model: 'gpt-4',
        stream: true,
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            try {
                for await (const chunk of completion) {
                    let content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        content = formatContent(content); // Format content with numbers and spacing
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (error) {
                controller.error(error);
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream);
}


