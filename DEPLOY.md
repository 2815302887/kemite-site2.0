# ��������ҵ�����ƶ˲����ֲ�

���ĵ����ڰѿ�������ҵ�������� Linux �Ʒ���������ǰ��Ŀ���á�һ�� Node/Express ���� + MySQL + Nginx ����������������ʽ��

�����ʱû�������� HTTPS��Ҳ������ʹ�÷��������� IP ���ʡ�

## 1. ����Ŀ��

�Ƽ�����Ŀ¼��

```bash
/var/www/kemite-site
```

�Ƽ� Node ����˿ڣ�

```bash
3001
```

�������ʷ�ʽ��

```text
http://����������IP/
```

����Ժ����������� HTTPS������ʷ�ʽ��ɣ�

```text
https://www.example.com/
```

## 2. �����ܹ�

��������ֻ����һ�� Node ����

```text
Nginx :80/:443
  ��
127.0.0.1:3001
  ��
Node/Express
  ������ ��̬ҳ�棺index.html��products.html��admin.html ��
  ������ ��̬��Դ��styles.css��public/products��public/datasheets
  ������ API��/api/products��/api/contact��/api/admin/*
```

��Ҫ�ڷ������ϵ������ `python -m http.server` ��Ϊǰ̨�������Ǳ�����ʱԤ���õģ����������ᵼ��ǰ�˺ͽӿڲ𿪣����׳��ֿ��򡢽ӿڵ�ַ���󡢺�̨�ϴ�·����ͬ�������⡣

## 3. ������Ҫ��

�Ƽ�ϵͳ��

- Ubuntu 22.04 LTS
- Ubuntu 24.04 LTS
- Debian 12

��Ҫ�������

- Node.js 20 ����߰汾
- npm
- MySQL 8 ����ݰ汾
- Nginx
- PM2
- Git

������

```bash
node -v
npm -v
mysql --version
nginx -v
pm2 -v
git --version
```

## 4. ��װ��������

����ϵͳ��

```bash
sudo apt update
sudo apt upgrade -y
```

��װ���������

```bash
sudo apt install -y git nginx mysql-server curl
```

���������û�� Node.js 20+������ʹ�� NodeSource ��װ��

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

��װ PM2��

```bash
sudo npm install -g pm2
```

## 5. ��ȡ��Ŀ����

���벿��Ŀ¼�ϼ���

```bash
sudo mkdir -p /var/www
cd /var/www
```

������״β���

```bash
sudo git clone https://github.com/2815302887/kemite-site.git kemite-site
cd /var/www/kemite-site
```

���Ŀ¼�Ѿ����ڣ������ȱ������ݣ��ٸ��´��롣

��Ҫ��������ݰ�����

```text
.env
products.json
public/products/
public/datasheets/
public/products-data.js
backups/products/
```

��Ҫ���ɾ����ЩĿ¼���ļ������ǿ��ܰ�����̨ά�����Ĳ�Ʒ���ϡ��ͻ��ϴ��ļ����Զ����ݡ�

## 6. ���¾���Ŀ�İ�ȫ����

������������Ѿ��о���Ŀ���Ƽ������淽ʽ���¡�

������ĿĿ¼��

```bash
cd /var/www/kemite-site
```

�ȱ��ݹؼ����ݣ�

```bash
sudo mkdir -p /var/backups/kemite-site
sudo tar -czf /var/backups/kemite-site/kemite-data-$(date +%Y%m%d-%H%M%S).tar.gz \
  .env \
  products.json \
  public/products \
  public/datasheets \
  public/products-data.js \
  backups/products
```

��ȡ���´��룺

```bash
git fetch origin
git pull origin main
```

���Զ�̷�֧���� `main`�����Ȳ鿴��

```bash
git branch -a
```

Ȼ��ʵ�ʷ�֧����ȡ��

## 7. ��װ����

����ĿĿ¼ִ�У�

```bash
cd /var/www/kemite-site
npm install
```

���������������Ҳ����ʹ�ã�

```bash
npm install --omit=dev
```

��ǰ��Ŀ�������ֱ࣬�� `npm install` Ҳ���ԡ�

## 8. ���û�������

����ģ�壺

```bash
cp .env.example .env
```

�༭��

```bash
nano .env
```

�����������ù��� IP ����ʱ����������д��

```env
PORT=3001
PUBLIC_ORIGIN=http://39.96.209.49

DB_HOST=localhost
DB_PORT=3306
DB_USER=kemite_user
DB_PASSWORD=replace_with_strong_password
DB_NAME=solder_paste_site
DB_CONNECTION_LIMIT=10

JWT_SECRET=replace_with_a_long_random_secret
JSON_LIMIT=12mb
UPLOAD_LIMIT_MB=8
BACKUP_RETENTION=50
```

�������� HTTPS �󣬸ĳɣ�

```env
PUBLIC_ORIGIN=https://www.example.com
```

����ǿ��� `JWT_SECRET`��

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

��������� `.env` �� `JWT_SECRET`��

## 9. ��ʼ�� MySQL

��¼ MySQL��

```bash
sudo mysql
```

�������ݿ���û���

```sql
CREATE DATABASE solder_paste_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kemite_user'@'localhost' IDENTIFIED BY 'replace_with_strong_password';
GRANT ALL PRIVILEGES ON solder_paste_site.* TO 'kemite_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Ȼ��ִ����Ŀ��ʼ����

```bash
npm run db:init
```

��ʼ���ᴴ����

- ����Ա�û���
- ��ϵ���Ա�
- Ĭ�Ϲ���Ա�˺�

�����޸�Ĭ�Ϲ���Ա�˺Ż����룬���飺

```text
server/sql/init.sql
```

## 10. �ļ�Ȩ��

Node ������Ҫд������λ�ã�

```text
products.json
public/products-data.js
public/products/
public/datasheets/
backups/products/
```

����Ŀ¼��

```bash
mkdir -p public/products public/datasheets backups/products
```

����õ�ǰ��¼�û����� PM2��

```bash
sudo chown -R $USER:$USER /var/www/kemite-site
```

����� `www-data` ���У�

```bash
sudo chown -R www-data:www-data /var/www/kemite-site
```

���鲻Ҫ��������Ŀ���� `777` Ȩ�ޡ�

## 11. ��� Node ����

���ֶ����ԣ�

```bash
npm run server
```

�����������˵�������������

```text
Kemite site server running on http://127.0.0.1:3001
```

���һ���ն˲��ԣ�

```bash
curl http://127.0.0.1:3001/api/health
```

����Ӧ���أ�

```json
{"status":"ok"}
```

ȷ��������ʹ�� PM2 �ػ���

```bash
pm2 start npm --name kemite-site -- run server
pm2 save
pm2 startup
```

PM2 �������

```bash
pm2 status
pm2 logs kemite-site
pm2 restart kemite-site
pm2 stop kemite-site
pm2 delete kemite-site
```

## 12. ���� Nginx

����վ�����ã�

```bash
sudo nano /etc/nginx/sites-available/kemite-site
```

��������ʹ�ù��� IP �����ã�

```nginx
server {
  listen 80;
  server_name _;

  client_max_body_size 12m;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

������ʱ��

```nginx
server {
  listen 80;
  server_name example.com www.example.com;

  client_max_body_size 12m;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

����վ�㣺

```bash
sudo ln -s /etc/nginx/sites-available/kemite-site /etc/nginx/sites-enabled/kemite-site
sudo nginx -t
sudo systemctl reload nginx
```

���Ĭ��վ���ͻ�����Խ��ã�

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 13. ���� HTTPS

û������ʱ����ʱ��Ҫ���� HTTPS��

���������������������󣬿���ʹ�� Certbot��

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

֤�����ڲ��ԣ�

```bash
sudo certbot renew --dry-run
```

HTTPS ��ú󣬼ǵð� `.env` �ĳɣ�

```env
PUBLIC_ORIGIN=https://www.example.com
```

Ȼ���������

```bash
pm2 restart kemite-site
```

## 14. �Ʒ�������ȫ��

�����ơ���Ѷ�Ƶȷ�������Ҫ�ڰ�ȫ����У�

- 80��HTTP
- 443��HTTPS����������ʹ��
- 22��SSH��������ʹ��

Node �� `3001` �˿ڽ��鲻�Թ������ţ�ֻ������� Nginx ���ʡ�

## 15. ��������

��������ִ�У�

```bash
node tools/verify-site.mjs
node --check server/src/index.js
curl http://127.0.0.1:3001/api/health
pm2 status
sudo nginx -t
```

��������ʣ�

```text
http://����������IP/
http://����������IP/products.html
http://����������IP/contact.html
http://����������IP/admin.html
http://����������IP/api/health
```

�ص��飺

- ��ҳ�ܴ�
- ��Ʒ�����ܿ�����Ʒ��ͼƬ
- ��Ʒ����ҳ�ܴ�
- ���� PDF ������
- ��ϵ������ύ
- ��̨�ܵ�¼
- ��̨�ܿ�������
- ��̨�ܱ༭��Ʒ������
- �ϴ���ƷͼƬ��ǰ̨����ʾ
- `/api/health` ���� `{"status":"ok"}`

## 16. �����������

�Ժ�������ʱ���Ƽ����̣�

```bash
cd /var/www/kemite-site
pm2 stop kemite-site
```

�������ݣ�

```bash
sudo mkdir -p /var/backups/kemite-site
sudo tar -czf /var/backups/kemite-site/kemite-data-$(date +%Y%m%d-%H%M%S).tar.gz \
  .env \
  products.json \
  public/products \
  public/datasheets \
  public/products-data.js \
  backups/products
```

���´��룺

```bash
git pull origin main
npm install
npm run db:init
node tools/verify-site.mjs
node --check server/src/index.js
pm2 restart kemite-site
```

����飺

```bash
pm2 logs kemite-site --lines 80
curl http://127.0.0.1:3001/api/health
```

## 17. ������ָ�

### ���� MySQL

```bash
mysqldump -u kemite_user -p solder_paste_site > solder_paste_site-$(date +%Y%m%d).sql
```

### �ָ� MySQL

```bash
mysql -u kemite_user -p solder_paste_site < solder_paste_site-20260704.sql
```

### ���ݲ�Ʒ����

```bash
tar -czf kemite-files-$(date +%Y%m%d).tar.gz \
  products.json \
  public/products-data.js \
  public/products \
  public/datasheets \
  backups/products
```

### �ָ���Ʒ����

```bash
tar -xzf kemite-files-20260704.tar.gz -C /var/www/kemite-site
pm2 restart kemite-site
```

## 18. ��־�鿴

PM2 ��־��

```bash
pm2 logs kemite-site
pm2 logs kemite-site --lines 200
```

Nginx ��־��

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

MySQL ״̬��

```bash
sudo systemctl status mysql
```

Nginx ״̬��

```bash
sudo systemctl status nginx
```

## 19. ���������Ų�

### ���ʹ��� IP û��Ӧ

��飺

```bash
sudo systemctl status nginx
sudo nginx -t
pm2 status
curl http://127.0.0.1:3001/api/health
```

����ԭ��

- �Ʒ�������ȫ��û�п��� 80
- Nginx û���
- Nginx ����û������
- Node ����û���
- PM2 �����쳣

### Nginx ���� 502

502 ͨ��˵�� Nginx �Ҳ�����˷���

��飺

```bash
pm2 status
pm2 logs kemite-site
curl http://127.0.0.1:3001/api/health
```

����ԭ��

- Node ����û�����
- `.env` �˿ڲ��� `3001`
- Nginx ����˿�д��
- Node ���ʱ�����˳�

### ��̨��¼ʧ��

��飺

```bash
pm2 logs kemite-site
sudo systemctl status mysql
npm run db:init
```

����ԭ��

- MySQL û���
- `.env` ���ݿ��û������������
- ���ݿ�û�г�ʼ��
- ����Ա�˺����벻��ȷ
- `JWT_SECRET` û������

### ��Ʒ����ʧ��

���Ȩ�ޣ�

```bash
ls -la products.json public/products-data.js public/products public/datasheets backups/products
```

����ԭ��

- Node �����û�û��дȨ��
- ��ƷͼƬ·������ `public/products/` ��ͷ
- PDF ·������ `public/datasheets/` ��ͷ
- ��Ʒ�ֶδ����������룬����̨�����߼�����

### �ϴ�ͼƬʧ��

��飺

- �ļ���С�Ƿ񳬹� `UPLOAD_LIMIT_MB`
- ͼƬ��ʽ�Ƿ�Ϊ PNG��JPG��JPEG��WebP
- `public/products/` �Ƿ��д
- Nginx �Ƿ������� `client_max_body_size 12m`

### ��ϵ����ύʧ��

��飺

- `/api/contact` �Ƿ��ܷ���
- MySQL �Ƿ�����
- `contacts` ���Ƿ����
- ���������̨�Ƿ��нӿڴ���

### ��Ʒҳû������

��飺

```bash
curl http://127.0.0.1:3001/api/products
ls -la products.json public/products-data.js
```

����ԭ��

- `products.json` ��ʽ����
- Node ����û�ж�ȡ����Ŀ��Ŀ¼
- `public/products-data.js` û��ͬ������
- ��ƷͼƬ·������

## 20. ����ά������

- ��Ҫ�� `.env` �ϴ��������ֿ�
- ��Ҫɾ�� `public/products/`��`public/datasheets/`��`backups/products/`
- ÿ�θ���ǰ�ȱ��ݲ�Ʒ����
- ���ڵ��� MySQL
- ���ڼ�� PM2 ��־
- ��ƷͼƬ����ͳһ�׵׺ͳߴ�
- ��Ʒ���� PDF ��������ʹ��Ӣ�ġ����֡��̺���
- ��̨�������ߺ�Ӧ��ʱ�޸�
- û������ʱ���� HTTP �͹��� IP������������/������ɺ��ټ� HTTPS

