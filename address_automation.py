from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.firefox import GeckoDriverManager
import time

class AddressAutomation:
    def __init__(self):
        self.url = "http://10.112.1.55:8080/NIG-Client-PB/"
        self.test_address = "KR 13A 38 95"  # Dirección de prueba
        self.setup_driver()

    def setup_driver(self):
        """Configurar el driver de Firefox"""
        options = Options()
        options.page_load_strategy = 'normal'
        service = Service(GeckoDriverManager().install())
        self.driver = webdriver.Firefox(service=service, options=options)

    def start_automation(self):
        """Iniciar el proceso de automatización"""
        try:
            print(f"Iniciando automatización con dirección: {self.test_address}")
            print("Abriendo Firefox...")
            
            # Abrir la página
            self.driver.get(self.url)
            print(f"Navegando a: {self.url}")
            
            # Esperar a que la página cargue (ajustar según necesidad)
            time.sleep(5)
            
            print("Página cargada exitosamente")
            
            # Aquí irá el resto de la automatización
            # Por ahora solo mantenemos la ventana abierta
            input("Presiona Enter para cerrar el navegador...")

        except Exception as e:
            print(f"Error durante la automatización: {str(e)}")
        finally:
            self.driver.quit()

if __name__ == "__main__":
    automation = AddressAutomation()
    automation.start_automation()
