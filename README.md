# Beneficio Joven Sitio Web: Manual técnico
Debido a que el principal objetivo de este proyecto es el Gobierno Municipal de Atizapán (México), todas las instrucciones están en español. 

Este documento incluye las instrucciones para realizar la salida a producción de este proyecto, en cuanto a BD, Sitio Web y todas las APIS que se requieren para operar correctamente. 

## 1. Base de datos y backend (APIs). 

### 1.1. Levantar instancias de AWS. 
Iniciar sesión en https://lightsail.aws.amazon.com/

Crear una instancia para guardar imagenes. 
<img width="1835" height="922" alt="image" src="https://github.com/user-attachments/assets/42556ba7-5ba9-4f3f-a32f-f9ea39d83b1a" />
<img width="863" height="662" alt="image" src="https://github.com/user-attachments/assets/427a6f3d-6eb6-46a7-abb1-c48db4068c3c" />

Una vez creada la bucket, es importante anotar la siguiente información: 
- Nombre de la bucket

Una vez creada la bucket, ve a la pestaña de permissions.

Ahí, habilita el siguiente nivel de acceso: 
<img width="1134" height="876" alt="image" src="https://github.com/user-attachments/assets/f38a08bd-747c-4e0f-8ee5-8eadffd5d8d8" />

Después, crea una llave de acceso y anota la llave de acceso y la contraseña creada: 
<img width="1059" height="394" alt="image" src="https://github.com/user-attachments/assets/40fddebf-4eea-4fae-860c-bcd3f134dece" />


Crear una instancia para la base de datos. 
<img width="1821" height="603" alt="image" src="https://github.com/user-attachments/assets/0c28ffbb-1d94-4be1-b129-23020dd1b021" />
<img width="1113" height="628" alt="image" src="https://github.com/user-attachments/assets/64ab9fb9-d157-4615-82ee-6caa829d5784" />

Una vez creada la base de datos, es importante anotar la siguiente información: 
- Endpoint de la base de datos
- Contraseña ingresada cuando se crea la base de datos

Crear una instancia para levantar el backend. 
<img width="1789" height="621" alt="image" src="https://github.com/user-attachments/assets/a5e8ecb4-bc9a-4b6c-bb00-102bcd440060" />
<img width="1302" height="717" alt="image" src="https://github.com/user-attachments/assets/4e4bfc86-3bb3-4dcf-abdb-9250d9dd9434" />
<img width="1347" height="748" alt="image" src="https://github.com/user-attachments/assets/1117359c-a016-4969-b9ed-d3e5b9edfb8d" />

Después, en la pestaña de networking, asignar una IP estática a tu instancia. 
<img width="1820" height="723" alt="image" src="https://github.com/user-attachments/assets/f3ae01da-d092-4831-9c4c-d027904a5b04" />

### 1.2. Creación de llave para servicios de IA. 
Ingresar a https://platform.openai.com/api-keys, crear una llave para la API de Open AI y pagar 5 dolares. 

### 1.3. Configuración de entorno. 
Después, se debe conectar a la instancia creada para el backend y ejecutar los siguientes comandos: 
```
git clone https://github.com/Daniel-Alvarez-Sil/Beneficio_Joven_Website.git
cd backend
# Crear entorno virtual
python -m venv venv
source venv/bin/activate

# Instalación de dependencias
cd rest_server
python -m pip install -r requirements.txt
```

Después, se debe modificar el archivo de variables de entorno: 
```
touch .env
sudo nano .env
#  Copiar lo siguiente en el archivo .env
OAUTH_CLIENT_ID=null
OAUTH_CLIENT_SECRET=null
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=[Ingresar contraseña de la base de datos]
DATABASE_HOST=[Ingresar endpoint de base de datos]
DATABASE_PORT=5432
SECRET_KEY=django-insecure-q(-&qkb%npk6d0)3%5af%ixmz$n+@g)egtk90^oqhj0e!6(ige
AWS_ACCESS_KEY_ID=[Ingresar la llave de acceso]
AWS_SECRET_ACCESS_KEY=[Ingresar aquí la contraseña de llave de acceso]
AWS_STORAGE_BUCKET_NAME=[Ingresar aquí el nombre del bucket creada]
OPENAI_API_KEY=[Ingresar aquí llave de OPEN AI creada]
```

### 1.4. Levantamiento de servicio oAuth. 
Crear un usuario administrador y prende el servidor ejecutando los siguientes comandos: 
```
python manage.py createsuperuser
python manage.py runserver
```

Después, ve a la siguiente url: IP_ESTATICA/o/applications e ingresa con el administrador que acabas de crear. 
1. Seleccion el botón que dice "registrar nueva aplicación"
2. Ingresa la siguiente información
  - Name: beneficiojoven
  - Client Type: confidential
  - Authorization Grant Type: Resource owner password-based
3. Acepta la configuración
4. Anota el Client_ID y el Client_SECRET

Ahora, apaga el servidor y actualiza los valores de tus variables de entorno
```
Ctrl+C # Para apagar el servidor
sudo nano .env

# Actualiza tu archivo .env
OAUTH_CLIENT_ID=null
OAUTH_CLIENT_SECRET=null
...
...
```

### 1.5. Prender servidor. 
```
sudo apt install tmux -y
tmux
python3 manage.py runserver 0.0.0.0:8000
```

## 2. Frontend (Sitio web). 

### 2.1. Levantar instancia de AWS. 

### 2.2. Despliegue. 

### 2.3. Exponer sitio web. 



