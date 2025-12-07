import streamlit as st
import google.generativeai as genai

# 1. SETUP PAGE
st.set_page_config(page_title="Roster AI 2.0", page_icon="📅")
st.title("📅 Sistem Roster AI (Versi 2.0)")

# 2. API SETUP
api_key = st.secrets.get("GOOGLE_API_KEY")

if not api_key:
    api_key = st.text_input("Masukkan Google API Key:", type="password")

if api_key:
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        # 3. INPUT USER
        st.info("✅ Model: Gemini 2.0 Flash (Ready)")
        st.write("### 📝 Masukkan Isu Roster:")
        
        user_input = st.text_area("Contoh: 'Ali MC hari ni. Siapa free ganti shift Pagi?'", height=150)
        
        # 4. BUTANG PROSES
        if st.button("🚀 Analisa Roster"):
            if user_input:
                with st.spinner("Sedang merangka penyelesaian..."):
                    
                    # Prompt khas untuk output ringkas & padat (sesuai WhatsApp)
                    prompt = f"""
                    Anda adalah Roster Manager. Sila analisa: "{user_input}"
                    
                    Berikan jawapan dalam format yang sesuai untuk di-copy ke WhatsApp Group.
                    Struktur jawapan:
                    1. 🚨 ISU (Ringkas)
                    2. ✅ CADANGAN SOLUSI (Point form)
                    3. 📅 JADUAL BARU (Jika perlu)
                    
                    Pastikan nada profesional tapi tegas.
                    """
                    
                    response = model.generate_content(prompt)
                    
                    # BAHAGIAN 1: Paparan Cantik (Web)
                    st.success("Analisa Siap!")
                    st.markdown("### 🔍 Hasil Analisa:")
                    st.markdown(response.text)
                    
                    # BAHAGIAN 2: Kotak Copy (WhatsApp)
                    st.write("---")
                    st.subheader("📋 Salin untuk WhatsApp:")
                    st.caption("Tekan ikon 'Copy' kecil di bucu kanan atas kotak kelabu ni 👇")
                    
                    # Kita letak dalam st.code supaya automatik ada butang Copy
                    st.code(response.text, language=None)
                    
            else:
                st.warning("Sila tulis isu roster dulu.")
                
    except Exception as e:
        st.error(f"Error: {e}")
else:
    st.warning("Sila masukkan API Key dulu.")
