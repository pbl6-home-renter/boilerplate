# NestJS Clean Architecture & CQRS Boilerplate

Boilerplate chuẩn doanh nghiệp (Enterprise-ready) tinh gọn và rõ ràng, được xây dựng dựa trên **Clean Architecture**, **Domain-Driven Design (DDD)** và **CQRS (Command Query Responsibility Segregation)** trên nền tảng **NestJS** và **TypeORM (PostgreSQL)**.

---

## 🚀 Tính năng nổi bật (Key Features)

- **Kiến trúc phân tầng sạch (Clean Architecture & DDD)**: Tách biệt hoàn toàn giữa tầng Domain, Use-case (Application), Infrastructure và Presentation. Business logic không phụ thuộc vào framework hay cơ sở dữ liệu.
- **CQRS Pattern (@nestjs/cqrs)**: Tách bạch rõ ràng giữa Commands (Ghi/Sửa/Xóa dữ liệu), Queries (Đọc dữ liệu) và Events (Xử lý sự kiện nội bộ).
- **Dependency Inversion (DI Tokens)**: Sử dụng Symbol DI Token để đảo ngược phụ thuộc giữa Domain và Infrastructure.
- **Cơ sở dữ liệu (TypeORM & PostgreSQL)**: Cấu hình Data Source tối ưu, tự động mapping snake_case naming strategy, hỗ trợ Migration và Database Seeding (`typeorm-extension`).
- **Global Exception Filter chuẩn Clean Architecture**: Tự động nhận diện Domain Exception (`DomainException`), NestJS `HttpException`, và Validation errors để map HTTP status code chuẩn xác (404, 409, 400...).
- **Tài liệu API tự động (Swagger/OpenAPI)**: Tự động sinh tài liệu API trực quan tại `/swagger`.
- **Bộ khung thuần khiết (Pure Skeleton)**: Không chứa logic nghiệp vụ dư thừa, dễ dàng sao chép và mở rộng cho bất kỳ dự án nào.

---

## 📁 Cấu trúc thư mục (Directory Structure)

```text
boilerplate/
├── .github/
│   └── workflows/
│       ├── db-keepalive.yml        # Job tự động giữ kết nối Supabase
│       └── deploy.yml              # CI/CD Build linux/amd64 & Deploy EC2
├── scripts/                        # Scripts bổ trợ (keepalive, migration...)
├── src/
│   ├── main.ts                     # Bootstrap REST API, Swagger & Validation
│   ├── app.module.ts               # Root module nạp các module con
│   ├── config/service.constants.ts # ServiceConstants: PATH, tên Swagger, DB mặc định
│   ├── database/migrations/        # Migration của service
│   │
│   ├── shared/                     # Shared kernel, giống hệt nhau giữa các service
│   │   ├── shared.module.ts        # Global Module (Config, TypeORM, RabbitMQ, UnitOfWork)
│   │   ├── security.module.ts      # Guard toàn cục
│   │   ├── domain/                 # BaseEntity, AggregateRoot, DomainException, Uuid, BaseRepository
│   │   ├── application/            # Port (UnitOfWork, publisher), phân trang, contract xác thực
│   │   ├── infrastructure/         # Config, TypeORM, RabbitMQ, verify access token
│   │   └── presentation/           # Guard, decorator, validator, filter/interceptor/pipe/middleware HTTP
│   │
│   └── modules/
│       ├── health/                 # Health check endpoint
│       ├── inbox/                  # Consumer-side dedup (processed_events)
│       ├── outbox/                 # Transactional Outbox & relay
│       └── sample/                 # [MODULE MẪU] Chuẩn Clean Architecture & CQRS
│           ├── sample.di-token.ts
│           ├── sample.module.ts
│           ├── domain/             # Entities, events, exceptions, repository interface
│           ├── application/
│           │   ├── commands/sample-create/   # SampleCreateCommand + handler
│           │   └── queries/sample-get-by-id/ # SampleGetByIdQuery + handler
│           ├── infrastructure/
│           │   └── persistence/    # TypeORM entity, repository, mappers/
│           └── presentation/
│               ├── http/           # controllers/, requests/, responses/, constants/
│               └── messaging/      # RabbitMQ subscriber
│
├── .env.example                    # Template biến môi trường
├── Dockerfile                      # Multi-stage Dockerfile (build & runner)
├── .dockerignore
├── start.sh                        # Entrypoint script khởi động container
├── package.json
└── tsconfig.json
```

---

## ⚙️ Cấu hình biến môi trường (Environment Variables)

Hệ thống sử dụng file `.env` được đọc và validate thông qua `ApiConfigService`. Sao chép từ mẫu:

```bash
cp .env.example .env
```

### Bảng chi tiết các biến:

| Biến | Mặc định / Mẫu | Bắt buộc | Mô tả chi tiết |
| :--- | :--- | :---: | :--- |
| **Cấu hình ứng dụng** | | | |
| `APP_NAME` | `MyApp` | Không | Tên hiển thị của ứng dụng trong Swagger/Logs |
| `PORT` | `3001` | Không | Cổng HTTP server lắng nghe (mặc định 3001) |
| `NODE_ENV` | `dev` / `production` | **Có** | Môi trường chạy (`dev`, `production`, `test`) |
| `API_DOMAIN` | `localhost` | Không | Domain chạy API (dùng cho Swagger Docs) |
| `API_VERSION` | `1.0.0` | Không | Phiên bản API hiện tại |
| `ENABLE_DOCUMENTATION` | `true` | Không | Bật/Tắt Swagger UI tại `/swagger` |
| `LOG_LEVEL` | `debug` / `info` | Không | Mức độ log (`debug`, `info`, `warn`, `error`) |
| **Cơ sở dữ liệu (PostgreSQL / Supabase)** | | | |
| `DATABASE_URL` | `postgresql://...` | **Có** | Chuỗi kết nối đầy đủ (khuyên dùng khi xài Supabase với connection pooler) |
| `DB_HOST` | `localhost` | Tùy chọn | Host database (nếu không dùng `DATABASE_URL`) |
| `DB_PORT` | `5432` | Tùy chọn | Port database |
| `DB_USERNAME` | `postgres` | Tùy chọn | Tên người dùng database |
| `DB_PASSWORD` | `postgres` | Tùy chọn | Mật khẩu database |
| `DB_DATABASE` | `app_db` | Tùy chọn | Tên database |
| `DB_SSL` | `true` / `false` | **Có** | Đặt `true` khi kết nối Supabase Cloud (bắt buộc SSL) |
| `ENABLE_ORM_LOGS` | `false` | Không | Bật `true` nếu muốn in câu lệnh SQL ra terminal khi debug |
| `MIGRATION_DATABASE_URL` | `postgresql://...` | Không | Connection string cho migration trực tiếp (Direct URL không qua pgbouncer) |
| **RabbitMQ Message Broker** | | | |
| `RABBITMQ_DEFAULT_USER` | `guest` | Không | Tài khoản đăng nhập RabbitMQ |
| `RABBITMQ_DEFAULT_PASS` | `guest` | Không | Mật khẩu RabbitMQ |
| `RABBITMQ_URL` | `amqp://...` | **Có** | Chuỗi kết nối RabbitMQ (`amqp://user:pass@localhost:5672` khi local, hoặc `amqp://...:5672@rabbitmq:5672` khi chạy Docker) |
| **Transactional Outbox** | | | |
| `RABBITMQ_EXCHANGE` | `MyApp.events` | Không | Durable topic exchange dùng cho integration events |
| `RABBITMQ_PREFETCH` | `10` | Không | Prefetch của channel mặc định (consumer queue dùng prefetch 1 để giữ thứ tự) |
| `RABBITMQ_CONSUMER_MAX_ATTEMPTS` | `5` | Không | Tổng số lần xử lý một message trước khi chuyển vào `<queue>.dlq` |
| `RABBITMQ_CONSUMER_RETRY_DELAY_MS` | `10000` | Không | Thời gian message chờ trong `<queue>.retry` trước khi xử lý lại |
| `OUTBOX_RELAY_ENABLED` | `true` | Không | Bật/tắt relay scheduler |
| `OUTBOX_RELAY_INTERVAL_MS` | `1000` | Không | Chu kỳ poll outbox |
| `OUTBOX_MAX_ATTEMPTS` | `10` | Không | Tổng số lần publish (tính cả lần đầu) trước khi chuyển `FAILED` |
| `OUTBOX_RETENTION_MS` | `604800000` | Không | Thời gian giữ row `PUBLISHED` |
| **Gọi service khác (internal HTTP)** | | | |
| `IDENTITY_SERVICE_URL` | `http://localhost:3001` | Khi cần gọi Identity | Base URL Identity-Service trong private network (`http://identity:3001` trên Docker) |
| `TENANCY_SERVICE_URL` | `http://localhost:3002` | Khi cần gọi Tenancy | Base URL Tenancy-Service (`http://tenancy:3002` trên Docker) |
| `INTERNAL_HTTP_TIMEOUT_MS` | `3000` | Không | Timeout mỗi lời gọi nội bộ |
| **Redis Cache (Tùy chọn)** | | | |
| `REDIS_HOST` | `localhost` | Không | Host Redis server |
| `REDIS_PORT` | `6379` | Không | Cổng Redis |
| **SMTP Mailer (Tùy chọn)** | | | |
| `MAIL_HOST` | `smtp.gmail.com` | Không | SMTP server gửi mail |
| `MAIL_PORT` | `465` | Không | Cổng SMTP |
| `MAIL_USER` | `your_email@...` | Không | Tài khoản gửi mail |
| `MAIL_PASS` | `app_password` | Không | App password Google |
| `MAIL_FROM` | `noreply@...` | Không | Tên hiển thị người gửi |

---

## 🔄 Luồng xử lý CQRS (CQRS Architecture Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Controller as SampleController (Presentation)
    participant CommandBus as CommandBus (CQRS)
    participant Handler as SampleCreateCommandHandler
    participant Domain as SampleEntity (Domain)
    participant Repo as SampleRepository (Infra)
    participant DB as PostgreSQL Database

    Client->>Controller: POST /api/v1/samples (CreateSampleRequest)
    Controller->>CommandBus: execute(new SampleCreateCommand(...))
    CommandBus->>Handler: execute(command)
    Handler->>Domain: SampleEntity.create(props)
    Handler->>Repo: save(sample)
    Repo->>DB: INSERT INTO samples
    Handler-->>Controller: Return Domain SampleEntity
    Controller-->>Client: 201 Created (SampleResponseDto)
```

---

## 🛠️ Hướng dẫn cài đặt & Khởi chạy

### 1. Khởi chạy trực tiếp (Local Development)

#### Bước 1: Cài đặt dependencies:
```bash
npm install
```

#### Bước 2: Cấu hình biến môi trường:
```bash
cp .env.example .env
# Chỉnh sửa DATABASE_URL Supabase và RABBITMQ_URL trong .env
```

#### Bước 3: Chạy Database Migrations:
```bash
npm run migration:run
```

#### Bước 4: Khởi chạy ứng dụng:
```bash
npm run start:dev
```
Truy cập Swagger API Docs tại: `http://localhost:3001/swagger`

---

### 2. Khởi chạy bằng Docker (Local Container)

```bash
# Build Docker image
docker build -t rentify-backend:local .

# Chạy container
docker run -p 3001:3001 --env-file .env rentify-backend:local
```

---

## 📋 Hướng dẫn thêm Module mới chuẩn Clean Architecture & CQRS

Xem [`docs/architecture.md`](docs/architecture.md) mục 4–5: layout module, quy ước đặt tên
use case `<noun>-<verb>` (vd. `commands/product-create/` → `ProductCreateCommand`) và các
bước tạo domain, repository, use case, controller, module. Module `sample` là ví dụ đầy đủ.

---

## 📜 Các lệnh Scripts hữu ích (NPM Scripts)

| Lệnh                                               | Ý nghĩa                                            |
| :------------------------------------------------- | :------------------------------------------------- |
| `npm run start:dev`                                | Chạy ứng dụng ở chế độ dev (watch mode)            |
| `npm run build`                                    | Biên dịch TypeScript sang JavaScript trong `dist/` |
| `npm run lint`                                     | Kiểm tra và sửa lỗi coding convention với ESLint   |
| `npm run format`                                   | Tự động format code với Prettier                   |
| `npm run migration:create -- name=MigrationName`   | Tạo một file migration mới                         |
| `npm run migration:generate -- name=MigrationName` | Tự động sinh migration từ Entity thay đổi          |
| `npm run migration:run`                            | Áp dụng các migration chưa chạy vào Database       |
| `npm run migration:revert`                         | Hoàn tác migration gần nhất                        |
| `npm run test`                                     | Chạy unit test với Jest                            |

---

## 🧭 Kiến trúc DDD & Clean Architecture

Cả `shared/` lẫn từng module đều chia 4 tầng với dependency một chiều:

```text
presentation ──┐
               ├──► application ──► domain
infrastructure ┘
```

- `domain/`: Entity, Aggregate Root, Value Object, domain event và repository interface.
- `application/`: command/query handler, port cho hạ tầng.
- `infrastructure/`: TypeORM entity, mapper, repository adapter, RabbitMQ adapter và scheduler.
- `presentation/`: HTTP controller, request/response DTO và broker subscriber.

Domain không import NestJS, TypeORM hay RabbitMQ. Infrastructure implement port bằng
DI token. `BaseEntity` chỉ chứa identity/lifecycle; aggregate có behavior và là nơi
phát domain event. Entity đọc từ database phải được reconstitute để không phát lại event.

Chi tiết (cấu trúc `shared/`, quy ước import, cách đồng bộ `shared/` sang service khác,
lệnh kiểm tra dependency rule): [`docs/architecture.md`](docs/architecture.md).

Command thay đổi state và có thể phát domain event. Query chỉ đọc. Domain event mô tả
sự kiện trong bounded context; integration event là contract gửi qua message broker.

## 📬 Transactional Outbox và microservice events

Khi một command cần vừa ghi database vừa publish event, không publish trực tiếp trong
handler vì sẽ gặp dual-write problem. Boilerplate ghi aggregate và `outbox_messages`
trong cùng local transaction, sau đó relay publish message đã commit:

```text
HTTP Request
  → Controller
  → Command Handler
  → Aggregate
  → Repository + Outbox
  → Database Transaction
  → Outbox Relay
  → RabbitMQ topic exchange
  → Consumer queue + Inbox
```

Delivery là at-least-once, không phải exactly-once. Consumer dùng `messageId` và bảng
`processed_events` để bỏ qua duplicate. RabbitMQ dùng durable topic exchange, queue
riêng cho từng loại aggregate, kèm retry queue (TTL) và DLQ. Ordering chỉ được cam kết
trong cùng aggregate; các aggregate khác có thể xử lý độc lập. Message outbox `FAILED`
được gỡ bằng `npm run outbox:requeue -- <message-id>`.

Transaction context được truyền explicit qua `IUnitOfWork`, không dùng
`AsyncLocalStorage`. RabbitMQ adapter dùng `@golevelup/nestjs-rabbitmq` và publisher
confirm; `@nestjs/microservices`/`ClientProxy` không còn được sử dụng.

Tài liệu học tập đầy đủ: [`docs/transactional-outbox-design.md`](docs/transactional-outbox-design.md).

### Transactional Outbox quick start

```bash
npm install
cp .env.example .env
npm run migration:run
npm run start:dev
```

Các biến chính gồm `RABBITMQ_EXCHANGE`, `RABBITMQ_PREFETCH`, `OUTBOX_RELAY_INTERVAL_MS`,
`OUTBOX_MAX_ATTEMPTS` và `OUTBOX_RETENTION_MS`. Có thể tắt relay bằng
`OUTBOX_RELAY_ENABLED=false`.

## 🔐 Xác thực (Authentication)

Mỗi service **tự verify access token** (RS256) do Identity-Service phát hành, kể cả khi request đã qua API Gateway. Không dùng header `x-user-*` để phân quyền: trong private network, ai gọi thẳng service cũng có thể tự gắn header đó, còn chữ ký JWT thì không giả được. Verify chạy cục bộ với JWKS đã cache (5 phút), không thêm network hop.

`SecurityModule` ([src/shared/security.module.ts](src/shared/security.module.ts)) đăng ký các guard toàn cục theo thứ tự:

| Guard | Việc làm | Lỗi |
|---|---|---|
| `ServiceTokenGuard` | Route `@InternalOnly()`: kiểm `X-Service-Token` = `SERVICE_TOKEN` | `401 UNAUTHORIZED` |
| `JwtAuthGuard` | Mọi route **mặc định cần token**; gắn `request.user = { id, role, status }` | `401 UNAUTHORIZED`, `503 AUTH_UNAVAILABLE` (không tải được JWKS) |
| `RolesGuard` | Kiểm `@Roles(...)` | `403 FORBIDDEN` |
| `ActiveUserGuard` | Chặn user `status=locked`, trừ khi `@AllowLocked(...)` cho phép role đó | `403 ACCOUNT_LOCKED` |

Mọi guard đều phải pass; thứ tự chỉ quyết định lỗi nào được trả khi nhiều guard cùng fail.

Decorator ([src/shared/presentation/decorators/auth/](src/shared/presentation/decorators/auth/)):

```ts
@Public()                         // không cần token (có token hợp lệ vẫn gắn request.user)
@Roles(UserRole.LANDLORD)         // giới hạn role
@AllowLocked()                    // cho phép mọi role bị khóa (vd. GET /me)
@AllowLocked(UserRole.TENANT)     // chỉ tenant bị khóa được gọi (vd. xem/thanh toán hoá đơn)
@InternalOnly()                   // service-to-service, xác thực bằng X-Service-Token
@CurrentUser() user: AuthenticatedUser
```

Quy ước đường dẫn khi fork:

- Đổi `ServiceConstants.PATH` (và `TITLE`, `DESCRIPTION`, `DEFAULT_DATABASE_NAME`) trong [src/config/service.constants.ts](src/config/service.constants.ts) (vd. `tenancy`). Không sửa `src/shared/`. Health: `GET /api/v1/<PATH>/health`, Swagger: `/api/v1/<PATH>/swagger`.
- Endpoint nội bộ đặt dưới `internal/...` (nằm **ngoài** prefix `api/v1`, gateway không route tới).
- Ownership dữ liệu (vd. landlord chỉ sửa building của mình) kiểm tra trong use-case, không phải guard.
- Service không bật CORS; API Gateway lo phần này.

Biến môi trường: `JWKS_URL` (hoặc `JWT_PUBLIC_KEY`), `JWT_ISSUER`, `JWT_AUDIENCE` phải khớp Identity-Service; `SERVICE_TOKEN` dùng chung giữa các service.

### Gọi service khác (internal HTTP)

- **Chỉ dùng để đọc (GET).** Ghi dữ liệu sang service khác thì phát event qua outbox.
- Gọi thẳng trong private network (`IDENTITY_SERVICE_URL`, `TENANCY_SERVICE_URL`), không đi qua gateway. Timeout `INTERNAL_HTTP_TIMEOUT_MS` (mặc định 3s).
- Inject `INTERNAL_HTTP_DI_TOKEN.CLIENT` (`IInternalHttpClient`) vào service ở tầng `infrastructure/` của module, sau một port riêng của module. Client tự gắn `X-Service-Token` (hoặc `Authorization` nếu truyền `bearerToken`) và trả về `data` đã bóc envelope.
- **Không retry.** Lỗi mạng/timeout/5xx → `PeerServiceUnavailableException` (503 `SERVICE_UNAVAILABLE`); 4xx → `PeerServiceRequestException` (giữ `statusCode`, `code` của peer). Use-case tự chọn: dữ liệu hiển thị thì fallback (`null`), dữ liệu ra quyết định thì để lỗi 503 đi ra (fail-closed).
- Type của response được khai báo lại trong module gọi, không import từ service khác (D58).

```ts
const stats = await this.client.get<UserStats>(
  PeerService.TENANCY,
  `/internal/users/${userId}/stats`,
);
```

---

## 🛡️ License

Dự án phát hành theo giấy phép MIT.
