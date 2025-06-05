import pandas as pd
import numpy as np
from pathlib import Path
import time
from datetime import datetime
from typing import Optional, Dict, List, Tuple
import logging
from address_parser import OptimizedAddressParser

class ExcelAddressProcessor:
    """
    Procesador optimizado para archivos Excel con direcciones
    Incluye validación, logging y manejo de errores robusto
    """
    
    def __init__(self, log_level: str = 'INFO'):
        self.parser = OptimizedAddressParser()
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
        """Configurar logging para seguimiento del proceso"""
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
        """Validar que el archivo existe y es accesible"""
        path = Path(file_path)
        
        if not path.exists():
            return False, f"El archivo {file_path} no existe"
        
        if not path.suffix.lower() in ['.xlsx', '.xls']:
            return False, f"El archivo debe ser Excel (.xlsx o .xls)"
        
        try:
            # Intentar leer las primeras filas para validar
            pd.read_excel(file_path, nrows=1)
            return True, "Archivo válido"
        except Exception as e:
            return False, f"Error leyendo el archivo: {str(e)}"
    
    def detect_address_column(self, df: pd.DataFrame) -> Optional[str]:
        """Detectar automáticamente la columna de direcciones"""
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
        
        # Si no encuentra por nombre, buscar columnas con contenido tipo dirección
        for col in df.columns:
            if df[col].dtype == 'object':
                sample = df[col].dropna().head(5)
                if len(sample) > 0:
                    # Verificar si contiene patrones de dirección
                    sample_text = ' '.join(sample.astype(str).str.upper())
                    if any(word in sample_text for word in ['CALLE', 'CL', 'CARRERA', 'KR', 'CRA']):
                        self.logger.info(f"Columna de direcciones detectada automáticamente: {col}")
                        return col
        
        return None
    
    def clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Limpiar y preparar el DataFrame"""
        # Eliminar filas completamente vacías
        df = df.dropna(how='all')
        
        # Resetear índice
        df = df.reset_index(drop=True)
        
        return df
    
    def process_addresses_batch(self, addresses: List[str], batch_size: int = 1000) -> List[str]:
        """Procesar direcciones en lotes para optimizar memoria"""
        results = []
        
        for i in range(0, len(addresses), batch_size):
            batch = addresses[i:i + batch_size]
            batch_results = [self.parser.parse_address(addr) for addr in batch]
            results.extend(batch_results)
            
            # Mostrar progreso
            if i % (batch_size * 10) == 0:
                progress = min(100, (i + batch_size) / len(addresses) * 100)
                self.logger.info(f"Progreso: {progress:.1f}% ({i + batch_size}/{len(addresses)})")
        
        return results

    def generate_report(self, df_original: pd.DataFrame, df_processed: pd.DataFrame, 
                       output_path: str, processing_time: float) -> Dict:
        """Generar reporte detallado del procesamiento"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'input_file': str(Path(output_path).stem + '_original'),
            'output_file': output_path,
            'processing_time_seconds': round(processing_time, 2),
            'statistics': self.stats.copy()
        }
        
        # Calcular estadísticas adicionales
        if 'Direccion_Parametrizada' in df_processed.columns:
            # Direcciones que cambiaron vs que se mantuvieron igual
            original_col = self.detect_address_column(df_original)
            if original_col:
                changed = (df_processed[original_col].astype(str) != 
                          df_processed['Direccion_Parametrizada'].astype(str)).sum()
                report['addresses_modified'] = int(changed)
                report['addresses_unchanged'] = int(len(df_processed) - changed)
        
        # Guardar reporte en JSON
        import json
        report_path = output_path.replace('.xlsx', '_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Reporte guardado en: {report_path}")
        return report
    
    def process_excel_file(self, file_path: str = "Backlog250525-filtradocobertura.xlsx", 
                          show_progress: bool = True) -> bool:
        """
        Procesar y parametrizar direcciones en archivo Excel
        """
        try:
            # Validar archivo
            is_valid, message = self.validate_file(file_path)
            if not is_valid:
                self.logger.error(message)
                return False
            
            # Leer archivo Excel y aplicar filtros
            df = pd.read_excel(file_path)
            
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
                
            # Filtrar direcciones válidas
            valid_addresses = df_filtered[address_col].dropna()
            
            # Mostrar información inicial
            print(f"\nArchivo: {file_path}")
            print(f"Total registros originales: {len(df)}")
            print(f"Registros después de filtros: {len(df_filtered)}")
            print(f"Direcciones a parametrizar: {len(valid_addresses)}")
            print(f"Columna: {address_col}")
            print("=" * 60)
            
            # Parametrizar direcciones
            print("\nPARAMETRIZANDO DIRECCIONES:")
            print("-" * 60)
            
            # Procesar direcciones en lotes para mejor rendimiento
            batch_results = self.process_addresses_batch(valid_addresses.tolist())
            
            # Crear nuevo DataFrame con resultados
            df_filtered.loc[valid_addresses.index, 'Direccion_Parametrizada'] = batch_results
            
            # Mostrar resultados
            for i, (orig, param) in enumerate(zip(valid_addresses, batch_results), 1):
                print(f"[{i}/{len(valid_addresses)}]")
                print(f"Original:      {orig}")
                print(f"Parametrizada: {param}")
                
                # Verificar si hubo cambio
                if orig != param:
                    print("✓ Dirección parametrizada")
                else:
                    print("! No se pudo parametrizar")
                print("-" * 60)

            # Actualizar estadísticas
            self.stats['total_rows'] = len(df)
            self.stats['processed'] = len(valid_addresses)
            self.stats['errors'] = sum(1 for orig, param in zip(valid_addresses, batch_results) if orig == param)
            
            # Guardar resultados
            output_path = file_path.replace('.xlsx', '_parametrizado.xlsx')
            df_filtered.to_excel(output_path, index=False)
            
            print(f"\nResultados guardados en: {output_path}")
            print(f"Total direcciones procesadas: {len(valid_addresses)}")
            print(f"Direcciones parametrizadas: {len(valid_addresses) - self.stats['errors']}")
            print(f"Errores de parametrización: {self.stats['errors']}")
            
            return True
                
        except Exception as e:
            self.logger.error(f"Error procesando archivo: {str(e)}")
            return False