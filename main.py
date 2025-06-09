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
from typing import Optional

# Importar módulos propios
try:
    from excel_processor import ExcelAddressProcessor
    from address_parser import OptimizedAddressParser 
    from test_address import AddressTester  # Cambiado de test_improved a test_address
except ImportError as e:
    print(f"❌ Error importando módulos: {e}")
    print("   Asegúrese de que todos los módulos necesarios estén instalados.")
    sys.exit(1)

def main():
    try:
        # Inicializar el procesador
        processor = ExcelAddressProcessor()
        
        # Nombre del archivo Excel a procesar
        excel_file = "Backlog_GPON_FILTRADO.xlsx"
        
        print(f"\nIniciando procesamiento de: {excel_file}")
        print("=" * 50)
        
        # Procesar el archivo
        result = processor.process_excel_file(excel_file)
        
        if not result:
            print("\n❌ Error: El procesamiento no se completó correctamente")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Error inesperado: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()