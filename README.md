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
Después, se debe conectar a la instancia creada para el backend
<img width="1323" height="755" alt="image" src="https://github.com/user-attachments/assets/a903f371-9345-4d1b-9dfa-c0bf3135b65f" />


Una vez conectado, ejecutar los siguientes comandos: 
```
git clone https://github.com/Daniel-Alvarez-Sil/Beneficio_Joven_Website.git
cd Beneficio_Joven_Website
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


## 2. Frontend (Sitio web)

### 2.1. Levantar instancia de AWS
Crear una instancia para levantar el frontend.  
<img width="1846" height="921" alt="image" src="https://github.com/user-attachments/assets/c9e23589-0817-4212-a7aa-c9f710d70a93" />
<img width="1856" height="918" alt="image" src="https://github.com/user-attachments/assets/93d847e5-31a7-4da4-97bb-69fd377e2cbb" />

Después, en la pestaña de **Networking**, asignar una **IP estática** a tu instancia.  
<img width="1820" height="723" alt="image" src="https://github.com/user-attachments/assets/f3ae01da-d092-4831-9c4c-d027904a5b04" />

> **Importante (Seguridad y puertos):** En Networking / firewall habilita **80 (HTTP)** y **443 (HTTPS)** para tu instancia.

---

### 2.2. Despliegue
Conectarse a la instancia creada.  
<img width="1323" height="755" alt="image" src="https://github.com/user-attachments/assets/964b57cf-3097-46bc-9166-49a0cbb17b17" />

Ejecutar los siguientes comandos:
```bash
# Actualiza el sistema
sudo apt-get update

# Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt-get install -y nodejs

# PM2 para producción (manejo de procesos)
sudo npm install -g pm2

# Clona el repo y construye
git clone https://github.com/Daniel-Alvarez-Sil/Beneficio_Joven_Website.git
cd Beneficio_Joven_Website/frontend
npm i
npm run build

# Arranca con PM2
pm2 start npm --name "frontend" -- start

# Haz persistente PM2 al reinicio
pm2 save
pm2 startup systemd -u $USER --hp $HOME
# Copia y ejecuta el comando que imprime (si aparece) para habilitar el servicio
````

Instala **Nginx** como proxy inverso (temporalmente en HTTP para probar):

```bash
sudo apt-get install -y nginx

# (Opcional) Firewall UFW
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
# sudo ufw enable   # solo si aún no está habilitado

# Edita el sitio por defecto (temporal)
sudo nano /etc/nginx/sites-available/default
```

Pega esto y guarda:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Valida y recarga:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Prueba en el navegador con la **IP pública**: `http://TU_IP`. Si carga, continúa con dominio y HTTPS.

---

### 2.3. Conectar dominio (DNS)

1. En tu **registrar** (donde compraste el dominio) crea un **registro A**:

   * **Tipo:** A
   * **Host:** `@` (raíz)
   * **Valor:** *IP estática pública de la instancia*
   * **TTL:** 5–15 min (o automático)
2. (Opcional) Crea un **CNAME** para `www` que apunte al dominio raíz:

   * **Tipo:** CNAME
   * **Host:** `www`
   * **Valor:** `tudominio.com.`

Verifica propagación DNS:

```bash
nslookup tudominio.com
# o
dig tudominio.com +short
```

---

### 2.4. HTTPS con Let’s Encrypt (Certbot)

Instala Certbot con el plugin de Nginx y prepara un server block para tu dominio:

```bash
sudo apt-get install -y certbot python3-certbot-nginx

# Crea un archivo de sitio para tu dominio
sudo nano /etc/nginx/sites-available/tudominio.com
```

Pega esta **configuración base HTTP** (ajusta `tudominio.com` y `www.tudominio.com`), guarda y cierra:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name tudominio.com www.tudominio.com;

    # Ruta ACME (por si se requiere)
    location /.well-known/acme-challenge/ { root /var/www/html; }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Habilita el sitio y deshabilita el default (si quieres apuntar solo al dominio):

```bash
sudo ln -s /etc/nginx/sites-available/tudominio.com /etc/nginx/sites-enabled/tudominio.com
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Emite y configura **HTTPS** con redirección automática:

```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com --redirect -m tu-email@dominio.com --agree-tos -n
```

Comprueba renovación automática:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

### 2.5. Ajustes de producción recomendados

**Variables de entorno (Next.js)**

```bash
# Ejemplos (ajusta a tu caso)
echo 'NEXT_PUBLIC_BASE_URL=https://tudominio.com' | sudo tee -a .env
echo 'NEXTAUTH_URL=https://tudominio.com' | sudo tee -a .env  # si aplica
```

Reconstruye si cambias `.env`:

```bash
npm run build
pm2 restart frontend
```

**Ciclo de despliegue**

```bash
pm2 status
pm2 logs frontend --lines 100

# Actualizar app
git pull
npm i
npm run build
pm2 restart frontend
```

**Logs Nginx**

```
/var/log/nginx/access.log
/var/log/nginx/error.log
```

---

### 2.6. Configuración final esperada (Nginx + SSL)

Tu archivo `/etc/nginx/sites-available/tudominio.com` quedará similar a esto (Certbot lo genera/ajusta):

```nginx
# Redirección HTTP -> HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$host$request_uri;
}

# Sitio en HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    # Proxy a Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # (Opcional) Estáticos con caché fuerte
    # location /_next/static/ {
    #     alias /ruta/a/.next/static/;
    #     access_log off;
    #     expires 7d;
    #     add_header Cache-Control "public, max-age=604800, immutable";
    # }
}
```

---

