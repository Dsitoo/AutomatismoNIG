from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from address_parser import AddressParser

def test_address_parsing():
    # Crear parser
    parser = AddressParser()
    
    # Casos de prueba
    test_cases = [
        "Transversal 18Bis # 38-41 piso 2",
        "Carrera 13 #54-74 2° piso (Casa contenedor Parqueadero) Chapinero",
        "$TRANSVERSAL 6 ESTE SUR 87-92"
    ]
    
    # Procesar y mostrar resultados
    for addr in test_cases:
        result = parser.parse_address(addr)
        print(f"Original: {addr}")
        print(f"Parametrizada: {result}\n")

def main():
    # Configurar el driver de Chrome
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
    
    try:
        test_address_parsing()
        # Navegar a una página web
        driver.get("https://www.google.com")
        
        # Encontrar el elemento de búsqueda
        search_box = driver.find_element(By.NAME, "q")
        
        # Escribir algo en el cuadro de búsqueda
        search_box.send_keys("Python Selenium")
        
        # Enviar la búsqueda
        search_box.submit()
        
        # Esperar un momento para ver los resultados
        driver.implicitly_wait(5)
        
        # Imprimir el título de la página
        print(f"Título de la página: {driver.title}")
        
    finally:
        # Cerrar el navegador
        driver.quit()

if __name__ == "__main__":
    main()
