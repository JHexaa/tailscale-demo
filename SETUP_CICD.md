# Configuracion CI/CD con GitHub Actions

Esta guia explica como configurar el pipeline de CI/CD para este proyecto.

## Arquitectura del Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        GITHUB ACTIONS                           │
│                                                                 │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────────┐  │
│  │   CI        │      │   Build     │      │   CD Deploy     │  │
│  │   - Lint    │ ───► │   - Docker  │ ───► │   - SSH to VM   │  │
│  │   - Test    │      │   - Test    │      │   - Pull code   │  │
│  └─────────────┘      └─────────────┘      │   - Rebuild     │  │
│                                            │   - Restart     │  │
│                                            └─────────────────┘  │
│                                                    │            │
└────────────────────────────────────────────────────┼────────────┘
                                                     │
                                                     ▼
                                          ┌─────────────────────┐
                                          │   VM Proxmox        │
                                          │   100.122.110.55    │
                                          │                     │
                                          │   Docker Compose    │
                                          │   - API             │
                                          │   - PostgreSQL      │
                                          │   - MinIO           │
                                          └─────────────────────┘
```

## Paso 1: Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Crea un nuevo repositorio (ej: `tailscale-demo`)
3. NO inicialices con README (ya tenemos archivos)

## Paso 2: Subir codigo al repositorio

```bash
cd ~/tailscale-demo

# Inicializar git
git init
git add .
git commit -m "Initial commit: FastAPI + PostgreSQL + MinIO"

# Conectar con GitHub
git remote add origin https://github.com/TU_USUARIO/tailscale-demo.git
git branch -M main
git push -u origin main
```

## Paso 3: Configurar GitHub Secrets

Ve a tu repositorio en GitHub:
**Settings → Secrets and variables → Actions → New repository secret**

### Secrets requeridos:

| Secret Name | Descripcion | Ejemplo |
|-------------|-------------|---------|
| `SERVER_HOST` | IP Tailscale de tu VM | `100.122.110.55` |
| `SERVER_USER` | Usuario SSH | `juanz26` |
| `SSH_PRIVATE_KEY` | Llave privada SSH | (ver abajo) |

### Secrets opcionales (para deploy avanzado):

| Secret Name | Descripcion |
|-------------|-------------|
| `POSTGRES_PASSWORD` | Password de PostgreSQL |
| `MINIO_ACCESS_KEY` | Access key de MinIO |
| `MINIO_SECRET_KEY` | Secret key de MinIO |
| `TS_OAUTH_CLIENT_ID` | OAuth client de Tailscale (opcional) |
| `TS_OAUTH_SECRET` | OAuth secret de Tailscale (opcional) |

## Paso 4: Generar llave SSH para GitHub Actions

En tu **maquina local**:

```bash
# Generar nueva llave SSH (sin passphrase)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_key -N ""

# Ver la llave privada (copiar TODO el contenido)
cat ~/.ssh/github_actions_key
```

Copia **todo** el contenido (incluyendo `-----BEGIN...` y `-----END...`) y pegalo en el secret `SSH_PRIVATE_KEY`.

En tu **VM** (100.122.110.55):

```bash
# Agregar la llave publica a authorized_keys
echo "CONTENIDO_DE_github_actions_key.pub" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

O mas facil:
```bash
# Desde tu maquina local
ssh-copy-id -i ~/.ssh/github_actions_key.pub juanz26@100.122.110.55
```

## Paso 5: Verificar configuracion SSH

Desde tu maquina local:

```bash
# Probar conexion con la nueva llave
ssh -i ~/.ssh/github_actions_key juanz26@100.122.110.55 "echo 'SSH OK'"
```

## Paso 6: Ejecutar el pipeline

### Automaticamente:
El pipeline se ejecuta automaticamente cuando:
- Haces push a `main` → CI + CD (deploy)
- Haces push a `develop` → Solo CI
- Creas un Pull Request a `main` → Solo CI

### Manualmente:
1. Ve a **Actions** en tu repositorio
2. Selecciona el workflow
3. Click en **Run workflow**

## Workflows disponibles

### 1. CI (`ci.yml`)
- **Trigger**: Push a main/develop, PRs a main
- **Acciones**:
  - Lint con Ruff
  - Tests con pytest
  - Build imagen Docker
  - Test de la imagen

### 2. Deploy Simple (`deploy-simple.yml`) ⭐ Recomendado
- **Trigger**: Push a main, manual
- **Acciones**:
  - Conecta via SSH directo
  - Pull del codigo
  - Rebuild contenedores
  - Health check

### 3. Deploy con Tailscale (`deploy.yml`)
- **Trigger**: Push a main, manual
- **Acciones**:
  - Conecta via Tailscale VPN
  - Mas seguro (no expone SSH a internet)
  - Requiere Tailscale OAuth

## Estructura de archivos

```
.github/
└── workflows/
    ├── ci.yml              # Pipeline de CI
    ├── deploy.yml          # Deploy con Tailscale
    └── deploy-simple.yml   # Deploy con SSH directo
```

## Troubleshooting

### Error: "Permission denied (publickey)"
- Verifica que la llave publica este en `~/.ssh/authorized_keys` de la VM
- Verifica que el secret `SSH_PRIVATE_KEY` tenga la llave completa

### Error: "Host key verification failed"
- El workflow ya maneja esto con `StrictHostKeyChecking=no`
- Si persiste, agrega la VM a known_hosts manualmente

### Error: "Connection refused"
- Verifica que SSH este corriendo en la VM: `sudo systemctl status sshd`
- Verifica que el puerto 22 este accesible

### Ver logs del deploy
```bash
# En la VM
cd ~/tailscale-demo
docker compose logs -f
```

## Seguridad

⚠️ **Importante**:
- Nunca commits el archivo `.env` con credenciales reales
- Usa GitHub Secrets para datos sensibles
- La llave SSH de deploy debe ser exclusiva para CI/CD
- Considera usar Tailscale OAuth para mayor seguridad

## Ejemplo de uso

```bash
# Hacer cambios localmente
vim app/main.py

# Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# El pipeline se ejecuta automaticamente
# Ve a GitHub Actions para ver el progreso
```

## Links utiles

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [SSH Action](https://github.com/appleboy/ssh-action)
- [Tailscale GitHub Action](https://github.com/tailscale/github-action)
