#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema de Parametrización de Direcciones - Menú Principal
Versión optimizada con interfaz mejorada y funcionalidades avanzadas
"""

import os
import sys
import time
from pathlib import Path
from datetime import datetime
from typing import Optional, List

# Importar módulos propios
try:
    from excel_processor import ExcelAddressProcessor
    from address_parser import OptimizedAddressParser 
    from automatismo import AddressAutomation
except ImportError as e:
    print(f"❌ Error importando módulos: {e}")
    print("   Asegúrese de que todos los módulos necesarios estén instalados.")
    sys.exit(1)

def main():
    try:
        print("🚀 Iniciando Sistema de Parametrización de Direcciones")
        print("=" * 60)
        
        # Inicializar el procesador de Excel
        processor = ExcelAddressProcessor()
        
        # Nombre del archivo Excel a procesar
        excel_file = "Backlog_GPON_FILTRADO.xlsx"
        
        # Verificar si el archivo existe
        if not os.path.exists(excel_file):
            # Intentar con archivo alternativo
            excel_file = "Backlog250525-filtradocobertura.xlsx"
            if not os.path.exists(excel_file):
                print(f"❌ Error: No se encontró ningún archivo Excel válido")
                print("   Archivos buscados:")
                print("   - Backlog_GPON_FILTRADO.xlsx")
                print("   - Backlog250525-filtradocobertura.xlsx")
                sys.exit(1)
        
        print(f"📂 Archivo encontrado: {excel_file}")
        print(f"📊 Iniciando procesamiento...")
        print("-" * 50)
        
        # Procesar el archivo Excel
        result = processor.process_excel_file(excel_file)
        
        if not result:
            print("\n❌ Error: El procesamiento del Excel no se completó correctamente")
            sys.exit(1)
        
        # Extraer direcciones parametrizadas desde la columna "Parametrización"
        print("\n🔍 Extrayendo direcciones parametrizadas...")
        parametrized_addresses = processor.get_addresses_from_column(excel_file, column='Parametrización')
        
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
        automation = AddressAutomation(parametrized_addresses)
        
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