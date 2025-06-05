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
    from automatismo import run_automation
except ImportError as e:
    print(f"❌ Error importando módulos: {e}")
    print("   Asegúrese de que todos los módulos necesarios estén instalados.")
    sys.exit(1)

def main():
    try:
        run_automation()
    except Exception as e:
        print(f"\n❌ Error inesperado: {str(e)}")

if __name__ == "__main__":
    main()