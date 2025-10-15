import { GoogleGenAI, Type } from "@google/genai";
import { ContactInfo } from '../types';

/**
 * Pre-processes an image file by drawing it to a canvas, applying contrast
 * and brightness filters, and then exporting it as a Base64-encoded JPEG.
 * This enhances the image quality for better OCR by the AI model.
 * @param file The image file to process.
 * @returns A promise that resolves to an object containing the base64 data and mime type.
 */
const preprocessImage = (file: File): Promise<{ base64Data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const image = new Image();
            image.src = reader.result as string;
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }

                canvas.width = image.width;
                canvas.height = image.height;

                // Apply filters to enhance readability for OCR
                ctx.filter = 'contrast(1.5) brightness(1.1)';
                ctx.drawImage(image, 0, 0);

                // Get the base64 data from the processed canvas
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                const base64Data = dataUrl.split(',')[1];
                
                resolve({ base64Data, mimeType: 'image/jpeg' });
            };
            image.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const extractContactsFromImages = async (files: File[]): Promise<ContactInfo[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    
    if (files.length === 0) {
        return [];
    }

    const imageParts = await Promise.all(
        files.map(async (file) => {
            const { base64Data, mimeType } = await preprocessImage(file);
            return {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                },
            };
        })
    );

    const prompt = `
        Your task is to act as an expert data entry specialist. You will be given one or more images of business cards that have been pre-processed to enhance clarity. They may be in various languages including English, Chinese, Japanese, and German.

        Follow these steps for each card:
        1.  **Scan and Identify:** Meticulously scan the entire card and identify every piece of text, logo, and scannable code (like QR codes).
        2.  **Analyze and Categorize:** For each piece of information, categorize it into the fields below. Be extremely thorough. Pay close attention to potential OCR errors (e.g., 'l' vs '1', 'o' vs '0').
        3.  **Format Output:** Consolidate the information for each distinct person into a JSON object.

        **Information to Extract:**
        -   **Full Name**: The person's complete name. This is a mandatory field.
        -   **Job Title**: Their professional title or role.
        -   **Company Name**: The name of their company.
        -   **Email Addresses**: A list of ALL email addresses on the card. Validate the format.
        -   **Phone Numbers**: A list of ALL contact numbers (mobile, office, fax). Include country/area codes.
        -   **Address**: The full physical address.
        -   **Website URL**: The company or personal website.
        -   **LinkedIn URL**: The full URL to their LinkedIn profile.
        -   **LINE ID**: Their LINE messenger ID.
        -   **QR Code URL**: If a QR code is present, extract the URL it points to.
        -   **Other Information**: Any other relevant text that doesn't fit the categories above (e.g., slogans, social media handles).

        Return a single JSON array containing one object for each person identified across all images. If a field is not present, omit its key from the JSON object. A name is mandatory for each person.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [...imageParts, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description: "The full name of the person on the business card.",
                        },
                        jobTitle: {
                            type: Type.STRING,
                            description: "The person's job title or role.",
                        },
                        companyName: {
                            type: Type.STRING,
                            description: "The name of the company.",
                        },
                        email: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of all email addresses of the person.",
                        },
                        phoneNumber: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of all contact phone numbers on the card.",
                        },
                        address: {
                            type: Type.STRING,
                            description: "The physical address, city, or location from the card.",
                        },
                        website: {
                            type: Type.STRING,
                            description: "The company or personal website URL.",
                        },
                        linkedinUrl: {
                            type: Type.STRING,
                            description: "The full LinkedIn profile URL.",
                        },
                        lineId: {
                            type: Type.STRING,
                            description: "The LINE ID of the person.",
                        },
                        qrCodeUrl: {
                            type: Type.STRING,
                            description: "The URL extracted from any QR code on the card.",
                        },
                        otherInfo: {
                            type: Type.STRING,
                            description: "Any other relevant text on the card that doesn't fit other categories.",
                        }
                    },
                    required: ["name"],
                },
            },
        },
    });

    try {
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText);

        if (!Array.isArray(parsedResult)) {
            throw new Error("AI response was not a JSON array.");
        }

        const result: ContactInfo[] = parsedResult.map(item => ({
            name: item.name,
            companyName: item.companyName || null,
            jobTitle: item.jobTitle || null,
            address: item.address || null,
            email: item.email || null,
            linkedinUrl: item.linkedinUrl || null,
            phoneNumber: item.phoneNumber || null,
            website: item.website || null,
            lineId: item.lineId || null,
            qrCodeUrl: item.qrCodeUrl || null,
            otherInfo: item.otherInfo || null,
        }));

        return result;

    } catch (e) {
        console.error("Failed to parse JSON response:", response.text, e);
        throw new Error("Could not process the response from the AI. The format was invalid.");
    }
};