import pandas as pd
import numpy as np
from pathlib import Path
import time
from datetime import datetime
from typing import Optional, Dict, List, Tuple
import logging
import re
from address_parser import OptimizedAddressParser

class ExcelAddressProcessor:
    """
    Procesador optimizado para archivos Excel con direcciones - VERSIÓN CORREGIDA
    """
    
    def __init__(self, log_level: str = 'INFO'):
        self.parser = OptimizedAddressParser()  # Usar el parser corregido
        self.setup_logging(log_level)
        self.processed_count = 0
        self.error_count = 0
        self.stats = {
            'total_rows': 0,
            'processed': 0,
            'errors': 0,
            'empty_addresses': 0,
            'processing_time': 0
        }
    
    def setup_logging(self, level: str):
        """Configurar logging"""
        log_level = getattr(logging, level.upper(), logging.INFO)
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'address_processing_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def validate_file(self, file_path: str) -> Tuple[bool, str]:
        """Validar archivo"""
        path = Path(file_path)
        
        if not path.exists():
            return False, f"El archivo {file_path} no existe"
        
        if not path.suffix.lower() in ['.xlsx', '.xls']:
            return False, f"El archivo debe ser Excel (.xlsx o .xls)"
        
        try:
            pd.read_excel(file_path, nrows=1)
            return True, "Archivo válido"
        except Exception as e:
            return False, f"Error leyendo el archivo: {str(e)}"
    
    def detect_address_column(self, df: pd.DataFrame) -> Optional[str]:
        """Detectar columna de direcciones"""
        possible_names = [
            'Dirección principal', 'direccion principal', 'DIRECCION PRINCIPAL',
            'Direccion', 'direccion', 'DIRECCION',
            'Dirección', 'direccion', 'DIRECCION',
            'Address', 'address', 'ADDRESS',
            'Dir', 'dir', 'DIR'
        ]
        
        for col in df.columns:
            if str(col).strip() in possible_names:
                return col
        
        # Buscar por contenido
        for col in df.columns:
            if df[col].dtype == 'object':
                sample = df[col].dropna().head(5)
                if len(sample) > 0:
                    sample_text = ' '.join(sample.astype(str).str.upper())
                    if any(word in sample_text for word in ['CALLE', 'CL', 'CARRERA', 'KR', 'CRA']):
                        self.logger.info(f"Columna de direcciones detectada: {col}")
                        return col
        
        return None
    
    def process_addresses_batch(self, addresses: List[str], batch_size: int = 1000) -> List[str]:
        """Procesar direcciones en lotes - VERSIÓN CORREGIDA"""
        results = []
        total = len(addresses)
        
        for i in range(0, total, batch_size):
            batch = addresses[i:i + batch_size]
            batch_results = []
            
            for addr in batch:
                try:
                    if pd.isna(addr) or not str(addr).strip():
                        batch_results.append("NO APARECE DIRECCION")
                        continue
                    
                    # Usar el parser corregido directamente
                    result = self.parser.parse_address(str(addr))
                    batch_results.append(result)
                    
                except Exception as e:
                    self.logger.error(f"Error procesando dirección '{addr}': {str(e)}")
                    batch_results.append("NO APARECE DIRECCION")
            
            results.extend(batch_results)
            progress = min(100, (i + batch_size) * 100 / total)
            self.logger.info(f"Progreso: {progress:.1f}% ({i + batch_size}/{total})")
        
        return results

    def process_excel_file(self, file_path: str = "Backlog250525-filtradocobertura.xlsx", 
                          show_progress: bool = True) -> bool:
        """Procesar archivo Excel - VERSIÓN CORREGIDA"""
        try:
            # Validar archivo
            is_valid, message = self.validate_file(file_path)
            if not is_valid:
                self.logger.error(message)
                return False
            
            # Leer archivo Excel
            df = pd.read_excel(file_path)
            
            # Aplicar filtros
            df_filtered = df[
                (df['Nombre producto'].isin(['Internet Dedicado', 'Conectividad Avanzada IP'])) &
                (df['Tipo operación'].str.strip() == 'Venta') &
                (df['Estado general'].str.upper().isin(['EN CURSO', 'NUEVOS INGRESOS'])) &
                (df['Ciudad de instalación'].str.contains('BOGOTÁ, D.C.', case=False, na=False)) &
                (df['Cliente'].str.upper() != 'SECRETARIA DE EDUCACION DEL DISTRITO')
            ]
            
            # Detectar columna de direcciones
            address_col = self.detect_address_column(df_filtered)
            if not address_col:
                self.logger.error("No se pudo detectar la columna de direcciones")
                return False
            
            # Obtener direcciones válidas
            valid_addresses = df_filtered[address_col].fillna("").astype(str)
            
            # Información inicial
            print(f"\nArchivo: {file_path}")
            print(f"Total registros originales: {len(df)}")
            print(f"Registros después de filtros: {len(df_filtered)}")
            print(f"Direcciones a parametrizar: {len(valid_addresses)}")
            print(f"Columna: {address_col}")
            print("=" * 60)
            
            # Parametrizar direcciones
            print("\nPARAMETRIZANDO DIRECCIONES:")
            print("-" * 60)
            
            # Procesar direcciones
            batch_results = self.process_addresses_batch(valid_addresses.tolist())
            
            # Agregar resultados al DataFrame
            df_filtered = df_filtered.copy()
            df_filtered['Direccion_Parametrizada'] = batch_results
            
            # Mostrar resultados
            unchanged_count = 0
            changed_count = 0
            error_count = 0
            
            for i, (orig, param) in enumerate(zip(valid_addresses, batch_results), 1):
                print(f"[{i}/{len(valid_addresses)}]")
                print(f"Original:      {orig}")
                print(f"Parametrizada: {param}")
                
                if param == "NO APARECE DIRECCION":
                    print("✗ No se pudo parametrizar")
                    error_count += 1
                elif str(orig).strip() == str(param).strip():
                    print("! No requería cambios")
                    unchanged_count += 1
                else:
                    print("✓ Dirección parametrizada")
                    changed_count += 1
                print("-" * 60)
            
            # Actualizar estadísticas
            self.stats['total_rows'] = len(df)
            self.stats['processed'] = len(valid_addresses)
            self.stats['errors'] = error_count
            
            # Guardar resultados
            output_path = file_path.replace('.xlsx', '_parametrizado_corregido.xlsx')
            df_filtered.to_excel(output_path, index=False)
            
            # Resumen final
            print(f"\n{'='*60}")
            print("RESUMEN DE PROCESAMIENTO")
            print(f"{'='*60}")
            print(f"Archivo guardado: {output_path}")
            print(f"Total direcciones procesadas: {len(valid_addresses)}")
            print(f"Direcciones parametrizadas: {changed_count}")
            print(f"Direcciones sin cambios: {unchanged_count}")
            print(f"Errores de parametrización: {error_count}")
            print(f"Tasa de éxito: {((changed_count + unchanged_count) / len(valid_addresses) * 100):.1f}%")
            
            return True
                
        except Exception as e:
            self.logger.error(f"Error procesando archivo: {str(e)}")
            return False


# Código para ejecutar el procesamiento
if __name__ == "__main__":
    processor = ExcelAddressProcessor()
    
    # Procesar el archivo
    success = processor.process_excel_file("Backlog250525-filtradocobertura.xlsx")
    
    if success:
        print("\n✅ Procesamiento completado exitosamente")
    else:
        print("\n❌ Error en el procesamiento")