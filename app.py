import streamlit as st
import google.generativeai as genai

st.set_page_config(page_title="AI Doctor", page_icon="🩺")
st.title("🩺 AI Connection Test")

# 1. Check API Key
api_key = st.secrets.get("GOOGLE_API_KEY")
st.write(f"🔑 Status API Key: {'Ada ✅' if api_key else 'Tiada ❌'}")

if api_key:
    try:
        genai.configure(api_key=api_key)
        
        st.write("---")
        st.write("⏳ Sedang menghubungi Google server...")
        
        # 2. Minta senarai model yang sah
        models_list = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                models_list.append(m.name)
        
        if models_list:
            st.success(f"Berjaya! Akaun anda support {len(models_list)} model:")
            for model in models_list:
                st.code(model) # Tunjuk nama model yang sah
        else:
            st.error("Server Google jawab OK, tapi tiada model dijumpai. Akaun mungkin baru sangat atau ada sekatan region.")
            
    except Exception as e:
        st.error("🔥 GAGAL MENGHUBUNGI SERVER:")
        st.error(f"Error Message: {e}")
        st.info("Tips: Check balik API Key. Pastikan tiada 'space' di hujung.")
else:
    st.warning("Sila masukkan API Key dalam Secrets.")
