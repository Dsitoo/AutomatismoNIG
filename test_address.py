import os
import sys
import time
from typing import List, Dict, Tuple
from datetime import datetime
import json
from pathlib import Path

try:
    from address_parser import OptimizedAddressParser
except ImportError:
    print("❌ Error: No se pudo importar OptimizedAddressParser")
    print("   Asegúrate de tener el archivo address_parser.py en el mismo directorio")
    sys.exit(1)

class AddressTester:
    """
    Tester interactivo avanzado para el sistema de parametrización de direcciones
    Incluye modo batch, comparaciones, historial y estadísticas
    """
    
    def __init__(self):
        self.parser = OptimizedAddressParser()
        self.history = []
        self.session_stats = {
            'total_tests': 0,
            'successful_parses': 0,
            'failed_parses': 0,
            'session_start': datetime.now().isoformat(),
            'avg_processing_time': 0
        }
        self.predefined_tests = self.load_test_cases()
    
    def load_test_cases(self) -> List[Dict]:
        """Cargar casos de prueba predefinidos para testing rápido"""
        return [
            {
                'name': 'Direcciones básicas',
                'cases': [
                    "Calle 146B # 90-26",
                    "Carrera 13 #54-74",
                    "Transversal 18Bis # 38-41",
                    "Diagonal 62 Sur No.20F-20"
                ]
            },
            {
                'name': 'Avenidas especiales',
                'cases': [
                    "Av El Dorado No. 66-63",
                    "Avenida Caracas # 4-00",
                    "AV. BOYACA No. 72-15",
                    "Av. NQS # 30-25"
                ]
            },
            {
                'name': 'Direcciones complejas',
                'cases': [
                    "CL 137D SUR #11 A 1 BOGOTA 4.469745490754561. -74.12529716131037",
                    "Kr 54 X Cl 138 EXT. 1100",
                    "Carrera 13 No. 32-05 Piso 2 Oficina 301",
                    "TV 6 B # 100 C - 55 SUR COORDENADAS: 4.4974344230021, -74.114822"
                ]
            },
            {
                'name': 'Casos edge',
                'cases': [
                    "CALLE",
                    "CL 74A # piso 2",
                    "Carrera 15 Bis No. 27 A - 16 SUR",
                    "DATACENTER WAN IDT",
                    ""
                ]
            }
        ]
    
    def clear_screen(self):
        """Limpiar pantalla del terminal"""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def display_header(self):
        """Mostrar header del programa"""
        print("🏠" + "="*58 + "🏠")
        print("    PARAMETRIZADOR DE DIRECCIONES - MODO TESTING")
        print("="*60)
        print(f"📊 Sesión actual: {self.session_stats['total_tests']} pruebas realizadas")
        print("="*60)
    
    def test_single_address(self, address: str = None) -> Tuple[str, str, float]:
        """Probar una sola dirección con medición de tiempo"""
        if not address:
            address = input("\n📍 Ingrese la dirección a parametrizar: ").strip()
        
        if not address:
            return "", "", 0
        
        # Medir tiempo de procesamiento
        start_time = time.time()
        result = self.parser.parse_address(address)
        processing_time = time.time() - start_time
        
        # Actualizar estadísticas
        self.session_stats['total_tests'] += 1
        if result != address:  # Se considera exitoso si cambió
            self.session_stats['successful_parses'] += 1
        else:
            self.session_stats['failed_parses'] += 1
        
        # Calcular tiempo promedio
        total_time = self.session_stats.get('total_processing_time', 0) + processing_time
        self.session_stats['total_processing_time'] = total_time
        self.session_stats['avg_processing_time'] = total_time / self.session_stats['total_tests']
        
        # Guardar en historial
        self.history.append({
            'timestamp': datetime.now().isoformat(),
            'original': address,
            'parametrized': result,
            'processing_time': processing_time,
            'changed': result != address
        })
        
        return address, result, processing_time
    
    def display_result(self, original: str, result: str, processing_time: float):
        """Mostrar resultado formateado"""
        print(f"\n{'='*60}")
        print("📋 RESULTADO:")
        print(f"{'='*60}")
        print(f"🔤 Original:      {original}")
        print(f"⚡ Parametrizada: {result}")
        print(f"⏱️  Tiempo:        {processing_time*1000:.2f} ms")
        
        # Indicar si cambió
        if result != original:
            print(f"✅ Estado:        Parametrizada exitosamente")
        else:
            print(f"⚠️  Estado:        No se pudo parametrizar")
        
        print(f"{'='*60}")
    
    def run_predefined_tests(self):
        """Ejecutar tests predefinidos"""
        print(f"\n{'='*60}")
        print("🧪 EJECUTANDO TESTS PREDEFINIDOS")
        print(f"{'='*60}")
        
        for test_group in self.predefined_tests:
            print(f"\n📂 {test_group['name']}:")
            print("-" * 40)
            
            for i, address in enumerate(test_group['cases'], 1):
                original, result, proc_time = self.test_single_address(address)
                status = "✅" if result != original else "⚠️"
                print(f"{i:2d}. {status} {original[:30]:<30} -> {result[:25]}")
            
            input("\n⏸️  Presiona Enter para continuar...")
    
    def batch_test_mode(self):
        """Modo de prueba por lotes"""
        print(f"\n{'='*60}")
        print("📦 MODO BATCH - PRUEBA MÚLTIPLE")
        print(f"{'='*60}")
        print("Ingrese direcciones (una por línea).")
        print("Escriba 'FIN' o línea vacía para terminar:\n")
        
        addresses = []
        while True:
            addr = input(f"Dirección {len(addresses)+1}: ").strip()
            if not addr or addr.upper() == 'FIN':
                break
            addresses.append(addr)
        
        if not addresses:
            print("❌ No se ingresaron direcciones")
            return
        
        print(f"\n🔄 Procesando {len(addresses)} direcciones...")
        print(f"{'='*60}")
        
        results = []
        total_start = time.time()
        
        for i, addr in enumerate(addresses, 1):
            original, result, proc_time = self.test_single_address(addr)
            results.append((original, result, proc_time))
            print(f"{i:2d}. {'✅' if result != original else '⚠️'} {proc_time*1000:5.1f}ms | {original[:40]}")
        
        total_time = time.time() - total_start
        
        # Mostrar resumen
        successful = sum(1 for _, result, _ in results if result != _)
        print(f"\n📊 RESUMEN BATCH:")
        print(f"   Total procesadas: {len(addresses)}")
        print(f"   Exitosas: {successful}")
        print(f"   Fallidas: {len(addresses) - successful}")
        print(f"   Tiempo total: {total_time:.2f}s")
        print(f"   Promedio: {total_time/len(addresses)*1000:.1f}ms por dirección")
    
    def show_session_history(self):
        """Mostrar historial de la sesión"""
        if not self.history:
            print("\n📝 No hay historial en esta sesión")
            return
        
        print(f"\n{'='*60}")
        print(f"📜 HISTORIAL DE LA SESIÓN ({len(self.history)} pruebas)")
        print(f"{'='*60}")
        
        for i, record in enumerate(self.history[-10:], 1):  # Últimas 10
            status = "✅" if record['changed'] else "⚠️"
            time_str = datetime.fromisoformat(record['timestamp']).strftime("%H:%M:%S")
            print(f"{i:2d}. {status} [{time_str}] {record['original'][:35]:<35} -> {record['parametrized'][:20]}")
        
        if len(self.history) > 10:
            print(f"\n... y {len(self.history)-10} más")
    
    def show_statistics(self):
        """Mostrar estadísticas de la sesión"""
        stats = self.session_stats
        success_rate = (stats['successful_parses'] / max(stats['total_tests'], 1)) * 100
        
        print(f"\n{'='*60}")
        print("📊 ESTADÍSTICAS DE LA SESIÓN")
        print(f"{'='*60}")
        print(f"🧪 Total de pruebas:     {stats['total_tests']}")
        print(f"✅ Exitosas:             {stats['successful_parses']}")
        print(f"⚠️  Fallidas:             {stats['failed_parses']}")
        print(f"📈 Tasa de éxito:        {success_rate:.1f}%")
        print(f"⏱️  Tiempo promedio:      {stats['avg_processing_time']*1000:.2f} ms")
        print(f"🕒 Inicio de sesión:     {datetime.fromisoformat(stats['session_start']).strftime('%H:%M:%S')}")
        print(f"{'='*60}")
    
    def export_history(self):
        """Exportar historial a archivo JSON"""
        if not self.history:
            print("\n❌ No hay historial para exportar")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"address_test_history_{timestamp}.json"
        
        export_data = {
            'session_info': self.session_stats,
            'test_history': self.history
        }
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            print(f"\n✅ Historial exportado: {filename}")
        except Exception as e:
            print(f"\n❌ Error exportando: {str(e)}")
    
    def show_menu(self):
        """Mostrar menú principal"""
        print(f"\n{'='*60}")
        print("📋 OPCIONES DISPONIBLES:")
        print(f"{'='*60}")
        print("1. 🔍 Probar dirección individual")
        print("2. 🧪 Ejecutar tests predefinidos")
        print("3. 📦 Modo batch (múltiples direcciones)")
        print("4. 📜 Ver historial de la sesión")
        print("5. 📊 Ver estadísticas")
        print("6. 💾 Exportar historial")
        print("7. 🔄 Limpiar pantalla")
        print("8. ❌ Salir")
        print(f"{'='*60}")
    
    def run(self):
        """Ejecutar el tester interactivo"""
        self.clear_screen()
        print("🚀 Iniciando Address Tester...")
        time.sleep(1)
        
        while True:
            self.clear_screen()
            self.display_header()
            self.show_menu()
            
            try:
                opcion = input("\n⚡ Seleccione una opción (1-8): ").strip()
                
                if opcion == "1":
                    original, result, proc_time = self.test_single_address()
                    if original:
                        self.display_result(original, result, proc_time)
                        input("\n⏸️  Presiona Enter para continuar...")
                
                elif opcion == "2":
                    self.run_predefined_tests()
                
                elif opcion == "3":
                    self.batch_test_mode()
                    input("\n⏸️  Presiona Enter para continuar...")
                
                elif opcion == "4":
                    self.show_session_history()
                    input("\n⏸️  Presiona Enter para continuar...")
                
                elif opcion == "5":
                    self.show_statistics()
                    input("\n⏸️  Presiona Enter para continuar...")
                
                elif opcion == "6":
                    self.export_history()
                    input("\n⏸️  Presiona Enter para continuar...")
                
                elif opcion == "7":
                    self.clear_screen()
                    print("🧹 Pantalla limpiada")
                    time.sleep(1)
                
                elif opcion == "8":
                    print(f"\n{'='*60}")
                    print("👋 FINALIZANDO SESIÓN")
                    print(f"{'='*60}")
                    self.show_statistics()
                    
                    if self.history:
                        export = input("\n💾 ¿Desea exportar el historial? (s/n): ").lower().strip()
                        if export in ['s', 'si', 'sí', 'y', 'yes']:
                            self.export_history()
                    
                    print("\n🎯 ¡Gracias por usar Address Tester!")
                    print("   ¡Hasta la próxima! 👋\n")
                    break
                
                else:
                    print(f"\n❌ Opción '{opcion}' no válida")
                    input("⏸️  Presiona Enter para continuar...")
                    
            except KeyboardInterrupt:
                print(f"\n\n{'='*60}")
                print("⚠️  INTERRUPCIÓN DETECTADA")
                print(f"{'='*60}")
                confirm = input("¿Está seguro de salir? (s/n): ").lower().strip()
                if confirm in ['s', 'si', 'sí', 'y', 'yes']:
                    print("\n👋 Programa terminado por el usuario")
                    break
            
            except Exception as e:
                print(f"\n❌ Error inesperado: {str(e)}")
                input("⏸️  Presiona Enter para continuar...")


def test_parametrizacion():
    """Función principal para compatibilidad con código existente"""
    tester = AddressTester()
    tester.run()


if __name__ == "__main__":
    test_parametrizacion()