#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema de Parametrización de Direcciones - Menú Principal
"""

import os
import sys
import time
from pathlib import Path
from datetime import datetime
from typing import Optional

# Importar módulos propios
try:
    from excel_processor import ExcelAddressProcessor
    from address_parser import OptimizedAddressParser 
    from automatismo import run_automation
except ImportError as e:
    print(f"❌ Error importando módulos: {e}")
    print("   Asegúrese de que todos los módulos necesarios estén instalados.")
    sys.exit(1)

def main():
    try:
        print("🚀 Iniciando Sistema de Parametrización de Direcciones")
        print("=" * 60)
        
        # Preguntar por parametrización
        while True:
            response = input("¿El documento Backlog_GPON_FILTRADO ya se encuentra parametrizado? (s/n): ").lower()
            if response in ['s', 'n']:
                break
            print("Por favor, responda 's' para sí o 'n' para no")

        # Inicializar el procesador de Excel
        processor = ExcelAddressProcessor()
        excel_file = "Backlog_GPON_FILTRADO.xlsx"
        
        # Verificar archivo
        if not os.path.exists(excel_file):
            print(f"❌ Error: No se encontró el archivo {excel_file}")
            sys.exit(1)
            
        print(f"📂 Archivo encontrado: {excel_file}")

        # Procesar Excel solo si no está parametrizado
        if response == 'n':
            print("📊 Iniciando parametrización...")
            result = processor.process_excel_file(excel_file)
            if not result:
                print("\n❌ Error: La parametrización no se completó correctamente")
                sys.exit(1)
        else:
            print("⏭️  Saltando parametrización...")

        # Extraer direcciones parametrizadas
        print("\n🔍 Extrayendo direcciones de la columna Prametrización...")
        try:
            parametrized_addresses = processor.get_addresses_from_column(excel_file, column='Prametrización')
        except Exception as e:
            print(f"❌ Error leyendo direcciones: {str(e)}")
            sys.exit(1)

        if not parametrized_addresses:
            # Si no hay direcciones en Parametrización, intentar procesarlas desde otra columna
            print("⚠️  No se encontraron direcciones en la columna 'Parametrización'")
            print("🔄 Intentando procesar direcciones desde address_parser...")
            
            # Usar el parser para extraer y parametrizar direcciones
            parser = OptimizedAddressParser()
            parametrized_addresses = parser.process_addresses_from_excel(excel_file, 'Parametrización')
            
            if not parametrized_addresses:
                print("❌ Error: No se pudieron obtener direcciones válidas")
                sys.exit(1)
        
        print(f"✅ Se encontraron {len(parametrized_addresses)} direcciones para procesar")
        print("\n📋 Primeras 5 direcciones a procesar:")
        for i, addr in enumerate(parametrized_addresses[:5], 1):
            print(f"   {i}. {addr}")
        
        if len(parametrized_addresses) > 5:
            print(f"   ... y {len(parametrized_addresses) - 5} más")
        
        # Confirmar ejecución
        print(f"\n🤖 Iniciando automatización con Selenium...")
        print("   ⚠️  Asegúrese de que Firefox esté instalado")
        print("   ⚠️  No mueva el mouse durante la automatización")
        print("-" * 50)
        
        # Esperar confirmación del usuario
        try:
            response = input("\n¿Desea continuar con la automatización? (s/n): ").lower().strip()
            if response != 's':
                print("❌ Automatización cancelada por el usuario")
                sys.exit(0)
        except KeyboardInterrupt:
            print("\n❌ Automatización cancelada por el usuario")
            sys.exit(0)
        
        # Ejecutar automatización
        print("\n🔄 Ejecutando automatización...")
        # Ejecutar el automatismo con las direcciones parametrizadas
        automation = run_automation()
        automation.addresses = parametrized_addresses
        automation.setup_driver()  # Reiniciar el driver con las nuevas direcciones
        
        print("✅ Automatización completada exitosamente")
        
    except KeyboardInterrupt:
        print("\n❌ Programa interrumpido por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()