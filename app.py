import streamlit as st
import google.generativeai as genai
import os

# Konfigurasi Halaman
st.set_page_config(page_title="Roster Planner AI", page_icon="📅")
st.title("📅 AI Master Roster Planner")

# Setup API Key
# Cuba dapatkan dari Secrets dulu
api_key = st.secrets.get("GOOGLE_API_KEY")

# Kalau tak ada di Secrets, minta user masukkan manual (fallback)
if not api_key:
    api_key = st.text_input("Masukkan Google API Key:", type="password")

if api_key:
    try:
        # Sambung ke Otak AI
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Ruangan Input
        st.write("### Masukkan Data Roster / Request")
        user_input = st.text_area("Contoh: Plan Ali(P) Abu(M), Actual Ali(MC). Buat report.", height=150)
        
        if st.button("🚀 Proses Roster"):
            if user_input:
                with st.spinner("AI sedang berfikir..."):
                    # Hantar arahan ke AI
                    response = model.generate_content(f"Sila bertindak sebagai pengurus roster. Analisa data ini dan beri output berguna: {user_input}")
                    
                    # Tunjuk Hasil
                    st.success("Siap!")
                    st.write(response.text)
            else:
                st.warning("Sila masukkan data dulu.")
                
    except Exception as e:
        st.error(f"Ada masalah dengan API Key: {e}")
else:
    st.info("Sila masukkan API Key untuk mula.")
