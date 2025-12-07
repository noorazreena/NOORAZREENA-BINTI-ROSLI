const handleGenerateAiNotes = async () => {
    // 1. Guna import.meta.env untuk Vite (React)
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY; 
    
    if (!apiKey) { 
        alert("API Key is missing. Sila set VITE_GOOGLE_API_KEY dalam Vercel Environment Variables."); 
        return; 
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      // 2. Guna model Gemini 2.0 Flash (sebab akaun kau support model ni)
      const modelId = 'gemini-2.0-flash'; 
      
      const dateStr = formatDate(date);
      const dayName = dateStr.split(' ')[0];
      const isWeekend = dayName === 'SABTU' || dayName === 'AHAD';
      
      const prompt = `Role: Sergeant, Polis Bantuan EcoWorld. Generate 4 concise daily briefing notes (Tugasan Khas) for ${dateStr} (${isWeekend ? 'Weekend' : 'Weekday'}). 1. Patrol, 2. Clubhouse, 3. Safety/Weather, 4. Equipment. Malay. Numbered.`;
      
      const response = await ai.models.generateContent({ 
          model: modelId, 
          contents: [{ role: 'user', parts: [{ text: prompt }] }] 
      });
      
      const text = response.response.text(); 
      
      if (text) {
        const lines = text.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && /^\d/.test(l))
            .slice(0, 4);
            
        if (lines.length > 0) setEditForm(prev => ({ ...prev, notes: lines }));
      }
    } catch (e) { 
        console.error(e); 
        alert("AI Error: Gagal generate notes. Check Console log."); 
    } finally { 
        setIsGenerating(false); 
    }
  };
