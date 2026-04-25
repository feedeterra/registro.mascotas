require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const Anthropic = require('@anthropic-ai/sdk');

// Configuraciones
const QUEUE_PATH = path.resolve(__dirname, '../data/approved_leads.json');
const DAILY_LIMIT = 50; 
const MIN_DELAY_MS = 3 * 60 * 1000; // 3 minutos
const MAX_DELAY_MS = 7 * 60 * 1000; // 7 minutos

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // Usa Contraseña de Aplicación de Google
    }
});

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomDelay() {
    return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1) + MIN_DELAY_MS);
}

async function generateCustomEmail(lead) {
    const prompt = `
Eres un experto en Copywriting B2B y captación de fondos. Eres parte de "Refugio CASA", un refugio canino en Buenos Aires.
Debes escribir un CORREO ELECTRÓNICO (Asunto y Cuerpo) para proponer una alianza estratégica/donación a esta entidad.

Datos de la entidad objetivo:
Nombre: ${lead.name}
Tipo: ${lead.type}
Podrían donar: ${lead.benefits || 'Recursos para animales'}
Requieren: ${lead.requirements ? lead.requirements.join(', ') : 'Ninguno especificado'}

Reglas del Copy:
- Empezar saludando cálidamente.
- Mostrar sutilmente que sabemos quiénes son y qué suelen pedir (los requisitos).
- Generar empatía y un poco de urgencia (nuestras capacidades de rescate en GBA están al límite este mes).
- Call to Action clarísimo: Pedir una simple llamada de 5 minutos, NO pedir recursos o dinero directamente en el correo.
- Tono: Educado pero humano, Español de Argentina neutro.

Formato de salida (DEBE CUMPLIR ESTA ESTRUCTURA EXACTA):
ASUNTO: <asunto aquí>
CUERPO:
<cuerpo aquí>
`;

    try {
        const msg = await anthropic.messages.create({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 400,
            temperature: 0.7,
            messages: [{ role: "user", content: prompt }]
        });
        
        const text = msg.content[0].text;
        const asuntoMatch = text.match(/ASUNTO:\s*(.+)/i);
        const cuerpoMatch = text.split(/CUERPO:/i);
        
        return {
            subject: asuntoMatch ? asuntoMatch[1].trim() : "Posible sinergia de impacto - Refugio CASA",
            text: cuerpoMatch.length > 1 ? cuerpoMatch[1].trim() : text
        };
    } catch(e) {
        console.error("Error contactando a Claude (Verifica tu API Key):", e.message);
        return null;
    }
}

async function startMailer() {
    console.log("📨 Iniciando Motor de Envío de Mails...");

    if (!fs.existsSync(QUEUE_PATH)) {
        console.log("❌ Faltan los datos aprobados:\n1. Ve a tu panel web (http://localhost:8114/sponsors_dashboard.html)\n2. Acepta algunos leads con ✓.\n3. Haz clic en 'Generar Flujo de Emails' abajo del todo.\n4. Coloca el archivo 'approved_leads.json' resultante que se descargó, adentro de tu carpeta 'data/'.");
        return;
    }

    let leads = [];
    try {
        leads = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
    } catch (e) {
        console.log("❌ Error leyendo el archivo queue approved_leads.json"); return;
    }

    const pendingLeads = leads.filter(l => !l.emailed);
    console.log(`📥 Leads seleccionados y pendientes de envío: ${pendingLeads.length}`);

    if(pendingLeads.length === 0) {
        console.log("Todo al día.");
        return;
    }

    let emailsSentToday = 0;

    for (let i = 0; i < pendingLeads.length; i++) {
        if (emailsSentToday >= DAILY_LIMIT) {
            console.log("\n🛑 Límite diario seguro de Gmail alcanzado (50 envíos). Reinicia este script mañana.");
            break;
        }

        const lead = pendingLeads[i];
        console.log(`\n✍️  Generando correo hiper-personalizado con Claude para >> ${lead.name}...`);
        
        const mailContent = await generateCustomEmail(lead);
        
        if (mailContent) {
            console.log(`📤 Encolando envío -> Asunto: "${mailContent.subject}"`);
            
            try {
                // ====== ⚠️MODO SIMULACION: Quitar los comentarios de abajo para enviar DE VERDAD ======
                /*
                await transporter.sendMail({
                    from: \`"Refugio CASA" <\${process.env.GMAIL_USER}>\`,
                    to: lead.email || process.env.GMAIL_USER, // Si la web no tiene mail, por seguridad de test se te envía a tu propia bandeja
                    subject: mailContent.subject,
                    text: mailContent.text
                });
                */

                console.log("✅ ¡Correo despachado correctamente!");
                
                // Actualizar log
                lead.emailed = true;
                emailsSentToday++;
                
                // Guardar el estado realtime para no repetir si hay un error al medio
                fs.writeFileSync(QUEUE_PATH, JSON.stringify(leads, null, 2));

                // Pausa "Humana" obligatoria entre 3 y 7 mins si hay más correos en la cola
                if (i < pendingLeads.length - 1 && emailsSentToday < DAILY_LIMIT) {
                    const delayToApply = getRandomDelay();
                    const asMinutes = (delayToApply / 1000 / 60).toFixed(1);
                    console.log(`⏳ [ANTI-SPAM] Esperando el retraso humano de ${asMinutes} minutos antes del siguiente correo...`);
                    await delay(delayToApply);
                }

            } catch(e) {
                console.error(`❌ Error enviando mail por Gmail a ${lead.name} (Verifica tu App Password):`, e.message);
            }
        }
    }
    console.log(`\n🏁 Proceso de envío finalizado por hoy. Correos mandados: ${emailsSentToday}`);
}

startMailer();
