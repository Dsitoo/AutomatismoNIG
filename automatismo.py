from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pyautogui
import os
import time
import pandas as pd

class AddressAutomation:
    def __init__(self):
        self.firefox_path = r"C:\Program Files (x86)\Mozilla Firefox\firefox.exe"
        self.url = "http://10.112.1.55:8080/NIG-Client-PB/"
        self.username = "clauhert"
        self.password = "clauhert"
        self.default_address = "KR 13 81 37"  # Dirección por defecto para pruebas
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
            time.sleep(1)  # Esperar que cargue post-login
        except Exception as e:
            print(f"Error en login: {str(e)}")
            raise

    def handle_silverlight(self):
        """Manejar activación de Silverlight"""
        try:
            print("Esperando prompt de Silverlight...")
            time.sleep(2)
            
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

    def click_new_query(self):
        """Hacer clic en el botón New Query usando coordenadas"""
        try:
            print("Esperando que cargue la interfaz...")
            time.sleep(2)  # Dar más tiempo para que cargue
            
            # Obtener posición de la ventana
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # El botón "New Query" está aproximadamente en la parte central-superior
            query_x = window['x'] + int(size['width'] * 0.45)  # 50% del ancho
            query_y = window['y'] + 160  # Misma altura que el botón anterior
            
            print(f"Haciendo clic en New Query: x={query_x}, y={query_y}")
            pyautogui.click(query_x, query_y)
            print("Clic realizado en New Query")
            
        except Exception as e:
            print(f"Error haciendo clic en New Query: {str(e)}")

    def click_gis_option(self):
        """Hacer clic en la opción GIS"""
        try:
            print("Haciendo clic en GIS...")
            time.sleep(1)
            
            # Obtener posición de la ventana
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Usar la misma coordenada Y que New Query pero diferente X
            gis_x = window['x'] + int(size['width'] * 0.1)  # 10% del ancho
            gis_y = window['y'] + 160  # Misma altura que New Query
            
            print(f"Haciendo clic en GIS: x={gis_x}, y={gis_y}")
            pyautogui.click(gis_x, gis_y)
            print("Clic realizado en GIS")
            
        except Exception as e:
            print(f"Error haciendo clic en GIS: {str(e)}")

    def click_address_option(self):
        """Hacer clic en la opción Address"""
        try:
            print("Haciendo clic en Address...")
            time.sleep(1)
            
            # Obtener posición de la ventana
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Misma coordenada X que New Query pero más abajo en Y
            address_x = window['x'] + int(size['width'] * 0.45)  # Igual que New Query
            address_y = window['y'] + 180  # 40px más abajo que New Query
            
            print(f"Haciendo clic en Address: x={address_x}, y={address_y}")
            pyautogui.click(address_x, address_y)
            print("Clic realizado en Address")
            
        except Exception as e:
            print(f"Error haciendo clic en Address: {str(e)}")

    def click_next_button(self):
        """Hacer clic en el botón Next"""
        try:
            print("Haciendo clic en Next...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # El botón Next está en la parte inferior derecha
            next_x = window['x'] + int(size['width'] * 0.35)  # 75% del ancho
            next_y = window['y'] + 400  # 40px más abajo que Address
            
            print(f"Haciendo clic en Next: x={next_x}, y={next_y}")
            pyautogui.click(next_x, next_y)
            print("Clic realizado en Next")
            
        except Exception as e:
            print(f"Error haciendo clic en Next: {str(e)}")

    def click_actual_count(self):
        """Hacer clic en Actual Count"""
        try:
            print("Haciendo clic en Actual Count...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Misma X que Address, pero más abajo en Y
            actual_x = window['x'] + int(size['width'] * 0.1)  # Igual que Address
            actual_y = window['y'] + 180  # Más abajo que el botón Next
            
            print(f"Haciendo clic en Actual Count: x={actual_x}, y={actual_y}")
            pyautogui.click(actual_x, actual_y)
            print("Clic realizado en Actual Count")
            
        except Exception as e:
            print(f"Error haciendo clic en Actual Count: {str(e)}")

    def click_name(self):
        """Hacer clic en el campo Name"""
        try:
            print("Haciendo clic en Name...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Misma X que Actual Count, 100px más abajo
            name_x = window['x'] + int(size['width'] * 0.1)  # Igual que Actual Count
            name_y = window['y'] + 280  # 100px más abajo que Actual Count
            
            print(f"Haciendo clic en Name: x={name_x}, y={name_y}")
            pyautogui.click(name_x, name_y)
            print("Clic realizado en Name")
            
        except Exception as e:
            print(f"Error haciendo clic en Name: {str(e)}")

    def click_equals(self):
        """Hacer clic en el campo Equals"""
        try:
            print("Haciendo clic en Equals...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Misma Y que Actual Count, pero 20% en X
            equals_x = window['x'] + int(size['width'] * 0.2)  # 20% del ancho
            equals_y = window['y'] + 180  # Misma Y que Actual Count
            
            print(f"Haciendo clic en Equals: x={equals_x}, y={equals_y}")
            pyautogui.click(equals_x, equals_y)
            print("Clic realizado en Equals")
            
        except Exception as e:
            print(f"Error haciendo clic en Equals: {str(e)}")

    def click_is_like(self):
        """Hacer clic en Is Like"""
        try:
            print("Haciendo clic en Is Like...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Misma X que Equals, 30px más en Y
            is_like_x = window['x'] + int(size['width'] * 0.2)  # Igual que Equals
            is_like_y = window['y'] + 220  # 40px más que Equals
            
            print(f"Haciendo clic en Is Like: x={is_like_x}, y={is_like_y}")
            pyautogui.click(is_like_x, is_like_y)
            print("Clic realizado en Is Like")
            
        except Exception as e:
            print(f"Error haciendo clic en Is Like: {str(e)}")

    def click_value(self):
        """Hacer clic en el campo Value y escribir la dirección"""
        try:
            print("Haciendo clic en Value...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Misma Y que Equals, pero 30% en X
            value_x = window['x'] + int(size['width'] * 0.4)
            value_y = window['y'] + 180
            
            # Hacer clic y escribir la dirección
            pyautogui.click(value_x, value_y)
            time.sleep(0.5)
            
            # Asegurar que la dirección termine con *
            address_to_write = self.default_address if self.default_address.endswith('*') else f"{self.default_address}*"
            pyautogui.write(address_to_write)
            print(f"Dirección '{address_to_write}' escrita en Value")
            
        except Exception as e:
            print(f"Error escribiendo en Value: {str(e)}")

    def click_add_to_list(self):
        """Hacer clic en Add to List"""
        try:
            print("Haciendo clic en Add to List...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Misma X que New Query, 20px más en Y que Value
            add_list_x = window['x'] + int(size['width'] * 0.45)  # Igual que New Query
            add_list_y = window['y'] + 200  # 20px más que Value
            
            print(f"Haciendo clic en Add to List: x={add_list_x}, y={add_list_y}")
            pyautogui.click(add_list_x, add_list_y)
            print("Clic realizado en Add to List")
            
        except Exception as e:
            print(f"Error haciendo clic en Add to List: {str(e)}")

    def click_search(self):
        """Hacer clic en Search"""
        try:
            print("Haciendo clic en Search...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Misma X que New Query, pero en la parte inferior
            search_x = window['x'] + int(size['width'] * 0.45)  # Igual que New Query
            search_y = window['y'] + 380  # Parte inferior
            
            print(f"Haciendo clic en Search: x={search_x}, y={search_y}")
            pyautogui.click(search_x, search_y)
            print("Clic realizado en Search")
            
        except Exception as e:
            print(f"Error haciendo clic en Search: {str(e)}")

    def minimize_window(self):
        """Hacer clic en el botón minimizar"""
        try:
            print("Minimizando ventana...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Botón minimizar está al 50% del ancho y cerca de la parte superior
            minimize_x = window['x'] + int(size['width'] * 0.48)
            minimize_y = window['y'] + 100
            
            print(f"Haciendo clic en minimizar: x={minimize_x}, y={minimize_y}")
            pyautogui.click(minimize_x, minimize_y)
            print("Ventana minimizada")
            
        except Exception as e:
            print(f"Error minimizando ventana: {str(e)}")

    def click_go_to(self):
        """Hacer clic en el botón Go To (azul)"""
        try:
            print("Haciendo clic en Go To...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Botón Go To está en la parte superior
            goto_x = window['x'] + int(size['width'] * 0.28)  # 50% del ancho
            goto_y = window['y'] + 350  # Altura aproximada del botón azul
            
            print(f"Haciendo clic en Go To: x={goto_x}, y={goto_y}")
            pyautogui.click(goto_x, goto_y)
            print("Clic realizado en Go To")
            
        except Exception as e:
            print(f"Error haciendo clic en Go To: {str(e)}")

    def set_scale(self):
        """Modificar la escala a 1:188 y presionar Enter"""
        try:
            print("Modificando escala...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Coordenadas para el campo de escala
            scale_x = window['x'] + int(size['width'] * 0.35)  # Posición del campo de escala
            scale_y = window['y'] + 130  # Altura del campo de escala
            
            # Hacer clic y escribir 88 (se agregará al 1:1 existente)
            print("Haciendo clic en campo de escala...")
            pyautogui.click(scale_x, scale_y)
            time.sleep(0.5)
            pyautogui.write("88")
            time.sleep(0.5)
            pyautogui.press('enter')  # Presionar Enter después de escribir
            print("Escala modificada a 1:188")
            
        except Exception as e:
            print(f"Error modificando escala: {str(e)}")

    def draw_selection_box(self):
        """Dibujar un cuadrado de selección alrededor del círculo verde"""
        try:
            print("Dibujando cuadrado de selección...")
            time.sleep(1)
            
            window = self.driver.get_window_position()
            size = self.driver.get_window_size()
            
            # Punto inicial (30% en X, 40% en Y)
            start_x = window['x'] + int(size['width'] * 0.3)
            start_y = window['y'] + int(size['height'] * 0.37)
            
            # Tamaño más pequeño para el cuadrado (60 píxeles)
            box_size = 60
            
            # Punto final
            end_x = start_x + box_size
            end_y = start_y + box_size
            
            # Hacer clic y arrastrar para crear el cuadrado
            pyautogui.mouseDown(start_x, start_y)
            time.sleep(0.5)
            pyautogui.dragTo(end_x, end_y, duration=1)
            pyautogui.mouseUp()
            
            print("Cuadrado de selección dibujado")
            
        except Exception as e:
            print(f"Error dibujando selección: {str(e)}")

    def get_association_value(self, save_to_excel=False):
        """Obtener el valor de Asociación de la tabla y guardarlo en un arreglo"""
        try:
            print("Obteniendo valor de Asociación...")
            time.sleep(3)
            self.asociacion = []
            
            # Usar selector CSS escapando los dos puntos
            table_selector = "#default\\:_id36\\:_id38\\:_id10\\:_id32\\:_id5\\:0\\:_id7\\:_id9"
            print(f"Buscando tabla con selector: {table_selector}")
            
            # Esperar y buscar la tabla directamente
            table = WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, table_selector))
            )
            print("Tabla encontrada!")
            
            # Extraer datos de la tabla
            rows = table.find_elements(By.TAG_NAME, "tr")
            for row in rows:
                cells = row.find_elements(By.TAG_NAME, "td")
                for cell in cells:
                    cell_text = cell.get_attribute('textContent').strip().lower()
                    if cell_text == 'true':
                        self.asociacion.append('Si')
                        print("Encontrado valor 'true', guardado como 'Si'")
                        return
            
            # Si no se encontró "true", agregar "No"
            self.asociacion.append('No')
            print("No se encontró el valor 'true', guardado como 'No'")
            
        except Exception as e:
            print(f"Error al procesar tabla: {str(e)}")
            self.asociacion.append('No')
        
        print(f"Estado final del arreglo asociacion: {self.asociacion}")

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
            
            # Hacer clic en New Query
            self.click_new_query()
            
            # Hacer clic en GIS
            self.click_gis_option()
            
            # Hacer clic en Address
            self.click_address_option()
            
            # Hacer clic en Next
            self.click_next_button()
            
            # Hacer clic en Actual Count
            self.click_actual_count()
            
            # Hacer clic en Name
            self.click_name()
            
            # Hacer clic en Equals
            self.click_equals()
            
            # Hacer clic en Is Like
            self.click_is_like()
            
            # Hacer clic en Value
            self.click_value()
            
            # Hacer clic en Add to List y Search
            self.click_add_to_list()
            self.click_search()
            
            # Minimizar ventana
            self.minimize_window()
            
            # Hacer clic en Go To
            self.click_go_to()
            
            # Modificar escala
            self.set_scale()
            
            # Dibujar cuadrado de selección
            self.draw_selection_box()
            
            # Obtener valor de Asociación
            self.get_association_value(save_to_excel=True)  # Activar guardado en Excel
            
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
