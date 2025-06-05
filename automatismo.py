from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pyautogui
import os
import time

class AddressAutomation:
    def __init__(self):
        self.firefox_path = r"C:\Program Files (x86)\Mozilla Firefox\firefox.exe"
        self.url = "http://10.112.1.55:8080/NIG-Client-PB/"
        self.username = "clauhert"
        self.password = "clauhert"
        self.setup_driver()

    def login(self):
        """Realizar el proceso de login"""
        try:
            # Esperar a que la tabla de login esté presente
            WebDriverWait(self.driver, 10).until(
                lambda d: d.find_element_by_class_name("login_table")
            )
            
            # Login
            print("Iniciando sesión...")
            self.driver.find_element_by_name("j_username").send_keys(self.username)
            self.driver.find_element_by_name("j_password").send_keys(self.password)
            self.driver.find_element_by_name("login").click()
            
            print("Login exitoso")
            time.sleep(2)  # Esperar que cargue post-login
        except Exception as e:
            print(f"Error en login: {str(e)}")
            raise

    def handle_silverlight(self):
        """Manejar activación de Silverlight"""
        try:
            print("Esperando prompt de Silverlight...")
            time.sleep(3)
            
            # Obtener la posición y tamaño de la ventana activa del navegador
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Calcular el centro de la ventana
            center_x = window['x'] + (size['width'] // 2)
            center_y = window['y'] + (size['height'] // 2)
            
            # Primer clic en el centro del navegador
            print("Haciendo clic en el centro del navegador...")
            pyautogui.click(center_x, center_y)
            time.sleep(2)
            
            # Clic en el botón "Allow Now" - está en la parte superior izquierda
            print("Haciendo clic en 'Allow Now'...")
            # El botón aparece aproximadamente a 115px desde la izquierda y 90px desde arriba
            allow_x = window['x'] + 110
            allow_y = window['y'] + 150
            pyautogui.click(allow_x, allow_y)
            
            print("Silverlight activado")
            
        except Exception as e:
            print(f"Error activando Silverlight: {str(e)}")

    def click_default_button(self):
        """Hacer clic en el botón de la barra de herramientas"""
        try:
            print("Esperando que cargue la interfaz...")
            time.sleep(5)
            
            # Obtener posición de la ventana
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Coordenadas ajustadas - botón está a aproximadamente 85% del ancho total
            # y 35px desde arriba en la barra de herramientas
            button_x = window['x'] + int(size['width'] * 0.84)  # 85% del ancho
            button_y = window['y'] + 120  # Altura de la barra de herramientas
            
            print(f"Haciendo clic en coordenadas: x={button_x}, y={button_y}")
            pyautogui.click(button_x, button_y)
            print("Clic realizado en las coordenadas especificadas")
            
        except Exception as e:
            print(f"Error haciendo clic en botón: {str(e)}")

    def setup_driver(self):
        try:
            # Configuración básica de Firefox
            print("Iniciando Firefox...")
            options = webdriver.FirefoxProfile()
            options.set_preference("browser.startup.page", 0)
            
            self.driver = webdriver.Firefox(firefox_profile=options)
            print("Firefox iniciado")
            
            # Navegar y hacer login
            self.driver.get(self.url)
            self.login()
            
            # Activar Silverlight
            self.handle_silverlight()
            
            # Hacer clic en el botón default
            self.click_default_button()
            
            input("Presiona Enter para cerrar...")
        except Exception as e:
            print(f"Error: {str(e)}")
            raise
        finally:
            if hasattr(self, 'driver'):
                self.driver.quit()

def run_automation():
    automation = AddressAutomation()

if __name__ == "__main__":
    run_automation()
