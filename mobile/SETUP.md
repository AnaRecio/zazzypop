# Configuración del app Flutter

## Prerrequisitos
1. Instalar Flutter: https://docs.flutter.dev/get-started/install/macos
2. Instalar Android Studio con un emulador configurado

## Setup inicial
```bash
# En la carpeta eventos-cr/mobile:
flutter create . --org com.zazzypop --project-name eventos_cr

# Instalar dependencias
flutter pub get

# Correr en emulador
flutter run
```

## Variables de entorno
Crear el archivo `lib/config.dart` con tus credenciales de Supabase:
```dart
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';
```

## Publicar en Play Store
```bash
flutter build appbundle --release
```
Subir el .aab a Google Play Console.
