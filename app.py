import streamlit as st
import google.generativeai as genai

# Setup Page
st.set_page_config(page_title="Roster AI", page_icon="📅")
st.title("📅 Sistem Roster AI")

# Ambil API Key
api_key = st.secrets.get("GOOGLE_API_KEY")

# Kalau key tak jumpa, minta user masukkan
if not api_key:
    api_key = st.text_input("Masukkan Google API Key:", type="password")

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    st.write("---")
    st.write("### Masukkan Data Roster:")
    user_input = st.text_area("Contoh: Plan Ali(P), Actual Ali(MC). Kira variance.", height=150)
    
    if st.button("🚀 Proses"):
        if user_input:
            with st.spinner("Sedang memproses..."):
                try:
                    response = model.generate_content(f"Bertindak sebagai HR manager. Analisa roster ini: {user_input}")
                    st.success("Siap!")
                    st.write(response.text)
                except Exception as e:
                    st.error(f"Error: {e}")
else:
    st.warning("Sila masukkan API Key untuk mula.")
