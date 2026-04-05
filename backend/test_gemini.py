import warnings
warnings.filterwarnings("ignore")
import google.generativeai as g

g.configure(api_key="AIzaSyCBw_INlZa8wBs3vkgr3V5brnRKOuiEbzU")

print("Test 1: gemini-2.0-flash generate_content")
try:
    model = g.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content("Say hello in exactly 5 words")
    print("OK:", response.text[:100])
except Exception as e:
    print("FAIL:", str(e)[:200])

print()
print("Test 2: gemini-2.0-flash chat stream")
try:
    model = g.GenerativeModel("gemini-2.0-flash", system_instruction="You are a helpful assistant.")
    chat = model.start_chat(history=[])
    response = chat.send_message("Say hello in 3 words", stream=True)
    full = ""
    for chunk in response:
        if chunk.text:
            full += chunk.text
    print("OK:", full[:100])
except Exception as e:
    print("FAIL:", str(e)[:200])
