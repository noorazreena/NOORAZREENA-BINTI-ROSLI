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
        
        # KITA GUNA MODEL YANG SAH DARI LIST KAU TADI
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        st.info("✅ Menggunakan Model: Gemini 2.0 Flash (Terkini)")
        
        # 3. INPUT USER
        st.write("### 📝 Masukkan Data Roster:")
        st.write("Contoh input: _'Plan: Ali(P), Abu(M). Actual: Ali(MC). Siapa patut ganti?'_")
        
        user_input = st.text_area("Data Roster / Isu:", height=150)
        
        # 4. BUTANG PROSES
        if st.button("🚀 Analisa Roster"):
            if user_input:
                with st.spinner("AI sedang berfikir..."):
                    # Prompt khas untuk HR/Roster
                    prompt = f"""
                    Anda adalah pakar HR dan Roster Manager.
                    Sila analisa situasi ini dan berikan:
                    1. Rumusan Masalah
                    2. Cadangan Penyelesaian (Siapa ganti/Apa perlu buat)
                    3. Jadual ringkas (jika perlu)
                    
                    Data: {user_input}
                    """
                    
                    response = model.generate_content(prompt)
                    st.success("Siap!")
                    st.markdown(response.text)
            else:
                st.warning("Sila tulis sesuatu dulu.")
                
    except Exception as e:
        st.error(f"Masalah Teknikal: {e}")
else:
    st.warning("Sila masukkan API Key dalam 'Secrets' untuk mula.")
