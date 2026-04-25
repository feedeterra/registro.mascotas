require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const path = require('path');
const FirecrawlApp = require('@mendable/firecrawl-js').default;
const Anthropic = require('@anthropic-ai/sdk');

// 1. Setup APIS
const firecrawlApp = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DB_PATH = path.resolve(__dirname, '../data/sponsors_db.json');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startScraping() {
  console.log("🚀 Iniciando búsqueda focalizada en ARGENTINA...");
  
  // Consultas optimizadas para encontrar pymes, forrajerías y laboratorios locales
  const queries = [
    "cadenas de pet shops provincia de buenos aires donan alimento",
    "laboratorios de productos veterinarios argentina contacto",
    "distribuidora alimentos para mascotas zona norte buenos aires responsabilidad social"
  ];

  let allResults = [];

  for (const query of queries) {
    console.log(`\n🔍 Buscando: "${query}"...`);
    
    let searchResponse;
    try {
        searchResponse = await firecrawlApp.search(query, {
          limit: 3, 
          scrapeOptions: { formats: ['markdown'] }
        });
    } catch(err) {
        console.error("❌ Error de Firecrawl (Verifica tu API Key en .env):", err.message);
        return;
    }

    if(!searchResponse.success) {
       console.error("❌ Búsqueda fallida:", searchResponse.error);
       continue;
    }

    for(const webpage of searchResponse.data) {
        console.log(`   Analizando web: ${webpage.url}`);
        
        const llmPrompt = `
          Analiza el texto de esta web y determina si es una empresa, veterinaria o pet shop que podría donar a un refugio canino.
          Filtro Estricto: Si la empresa o sucursal NO es de Argentina o Buenos Aires, en el campo "country" pon "Extranjero".
          Tu tarea es evaluar la "Probabilidad de ayudarnos".
          - Alta: Si es un pet shop, forrajería o marca nacional chica.
          - Media: Laboratorio nacional o red de veterinarias.
          - Baja: Corporaciones gigantes (Purina, Pedigree) porque es más burocrático.

          Devuelve UNICAMENTE un JSON válido con esta estructura:
          {
            "name": "Nombre",
            "country": "Argentina u Extranjero",
            "location": "Ciudad o Zona (Ej: Zona Norte, CABA)",
            "type": "Pet Shop / Distribuidora / Empresa / Veterinaria",
            "requirements": ["Debe ser ONG registrada", "Solicitan planillas"],
            "benefits": "Kilos de alimento bolsa, vacunas, etc",
            "difficulty": "Alta / Media / Baja"
          }
          
          Contenido Web:
          ${webpage.markdown ? webpage.markdown.substring(0, 6000) : "No hay contenido."}
        `;

        try {
            const msg = await anthropic.messages.create({
                model: "claude-3-5-haiku-20241022",
                max_tokens: 500,
                temperature: 0,
                messages: [{ role: "user", content: llmPrompt }]
            });
            
            const jsonMatch = msg.content[0].text.match(/\{[\s\S]*\}/);
            if(jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                data.id = 'sp_' + Date.now() + '_' + Math.random().toString(36).substring(2,8);
                data.website = webpage.url;
                
                // Filtro 100% Argentina como pidió el usuario
                if(data.country.toLowerCase().includes('argentina') || data.location.toLowerCase().includes('buenos aires')) {
                     allResults.push(data);
                     console.log(`   ✅ ¡Lead Agregado! [${data.difficulty}] ${data.name}`);
                } else {
                     console.log(`   ❌ Descartado (No Cumple Criterio Argentina): ${data.name}`);
                }
            } else {
                 console.log(`   ⚠️ La IA no pudo estructurar la información para: ${webpage.url}`);
            }
        } catch (e) {
            console.error("   ❌ Error procesando con Claude IA (Verifica tu clave ANTHROPIC_API_KEY):", e.message);
        }
        await delay(1500); 
    }
  }

  console.log(`\n🎉 Proceso finalizado. Se encontraron ${allResults.length} entidades listas para invitar.`);
  
  if (allResults.length > 0) {
      let currentDb = [];
      try {
          currentDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      } catch(e) { } 
      
      const updatedDb = [...allResults, ...currentDb];
      fs.writeFileSync(DB_PATH, JSON.stringify(updatedDb, null, 2));
      console.log(`📂 Datos inyectados en ./data/sponsors_db.json. Refresca el panel web.`);
  }
}

// Iniciar
startScraping();
