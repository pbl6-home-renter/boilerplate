# Kiến trúc: Clean Architecture + DDD

Tài liệu này mô tả cách tổ chức code trong boilerplate và mọi service fork từ nó
(Identity-Service, …). Mục tiêu: nhìn đường dẫn là biết file thuộc tầng nào, và
`src/shared/` **giống hệt nhau** giữa các service để đồng bộ bằng cách copy thư mục.

## 1. Các tầng và dependency rule

```text
            presentation ──┐
                           ├──► application ──► domain
          infrastructure ──┘
```

| Tầng | Chứa gì | Được import |
|---|---|---|
| `domain/` | Entity, aggregate root, value object, domain event, domain exception, repository interface | Chỉ `domain/` khác. **Không** import `@nestjs/*`, `typeorm`, `express` |
| `application/` | Command/query + handler, port (interface cho hạ tầng), kiểu phân trang, contract xác thực | `domain/`, `application/`. Được dùng decorator của `@nestjs/cqrs`/`@nestjs/common` để đăng ký handler và `@Inject` port |
| `infrastructure/` | TypeORM entity, repository, mapper, adapter RabbitMQ, scheduler, CLI, đọc cấu hình | Mọi tầng trừ `presentation/` |
| `presentation/` | Controller, request/response DTO, guard, decorator, filter, interceptor, pipe, subscriber RabbitMQ | `application/`, `domain/`, (và `infrastructure/` khi chỉ để wiring) |

Hệ quả cụ thể:

- Repository interface nằm ở `domain/repositories/` và chỉ nhận/trả kiểu domain. Vì vậy
  `TransactionContext` nằm ở `shared/domain/repositories/transaction-context.ts`.
- Đọc danh sách / phân trang **không** đặt trên repository của aggregate. Khai báo một
  query-service port trong `application/ports/` (trả `PaginatedResult<T>`), implement ở
  `infrastructure/` bằng `TypeOrmPaginator`.
- `UserRole`/`UserStatus` là shared kernel nên nằm ở `shared/domain/enums`: aggregate `User` của
  Identity cần chúng, và domain không được import `application/`.
- Handler không đọc `ApiConfigService` trực tiếp. Module cung cấp cấu hình qua DI token
  (xem `OUTBOX_DI_TOKEN.CONFIG` trong `modules/outbox/outbox.module.ts`).
- Command/query không import request DTO. Request DTO có `static toCommand(request, ...ngữ cảnh)`
  (vd. `SampleCreateRequestDto.toCommand(request)`, `CreateRatePolicyRequest.toCommand(request, user.id)`
  ở Tenancy) — presentation → application, đúng chiều. Controller không tự map từng field.
  Query handler trả kiểu domain/`PaginatedResult`, controller map sang response DTO bằng
  `XResponseDto.fromDomain`.
- Import chéo module tuân theo cùng chiều phụ thuộc: `domain/` và `application/` của module
  này không được import `infrastructure/`/`presentation/` của **bất kỳ** module nào. Import
  cùng tầng giữa hai module được phép, ví dụ quan hệ TypeORM giữa `UserEntity` và
  `RefreshTokenEntity` (cùng một database).

## 2. `src/` tổng quan

```text
src/
├── main.ts, app.module.ts
├── config/service.constants.ts   # class ServiceConstants: MỌI giá trị riêng của service
│                                  # (PATH, TITLE, DESCRIPTION, DEFAULT_DATABASE_NAME)
├── database/migrations/           # migration của cả service (một timeline chung)
├── shared/                        # giống hệt nhau giữa các service — KHÔNG sửa riêng lẻ
└── modules/<context>/             # seed nằm trong module: infrastructure/seeds/*.seeder.ts
```

Migration để chung vì TypeORM chạy chúng theo một thứ tự timestamp duy nhất, ghi vào một
bảng `migrations`, và một migration có thể đụng bảng của nhiều module (FK). Seed thì
thuộc về module sở hữu dữ liệu: nó dùng TypeORM entity (và service như password hasher)
của chính module đó, nên xoá/tách module thì seed đi theo.

## 3. `src/shared/`

```text
shared/
├── shared.module.ts               # @Global: Config, TypeORM, RabbitMQ, UnitOfWork
├── security.module.ts             # guard toàn cục + AccessTokenVerifier
├── domain/                        # shared kernel
│   ├── base/                      # BaseEntity, AggregateRoot, DomainEvent
│   ├── enums/                     # UserRole, UserStatus (dùng chung mọi service)
│   ├── exceptions/                # DomainException (gốc của mọi lỗi nghiệp vụ), ValidationException
│   ├── repositories/              # BaseRepository, TransactionContext
│   └── value-objects/             # Uuid (+ generateUuid, isValidUuid), SortOrder
├── application/
│   ├── auth/                      # AuthenticatedUser, AuthErrorCode
│   ├── messaging/                 # IntegrationEvent, OutboxConfig
│   ├── pagination/                # OffsetPageQuery, PaginatedResult, OffsetPageInfo
│   ├── ports/                     # IUnitOfWork, IMessageBrokerPublisher
│   └── di-tokens.ts               # UNIT_OF_WORK_DI_TOKEN, MESSAGE_BROKER_DI_TOKEN
├── infrastructure/
│   ├── config/                    # ApiConfigService, config-value, *.config.ts
│   ├── database/                  # TypeORM module/options, data-source (CLI), AbstractEntity,
│   │                              # transaction/ (UnitOfWork), pagination/ (TypeOrmPaginator)
│   ├── messaging/rabbitmq/        # publisher, consumer registry, retry/DLQ
│   └── security/                  # AccessTokenVerifier, JwtPayload
└── presentation/
    ├── decorators/                # ApiSuccessResponse, ResponseCode, auth/ (@Public, @Roles, …)
    ├── guards/                    # ServiceToken, JwtAuth, Roles, ActiveUser
    ├── validators/                # @IsRequired, @IsUuid (class-validator)
    ├── pagination/                # DTO phân trang cho Swagger
    └── http/                      # filters/, interceptors/, pipes/, middleware/, bootstrap/ (swagger, logging),
                                   # authenticated-request.ts
```

`shared/` chỉ đọc giá trị riêng của service qua `ServiceConstants` (`config/service.constants.ts`). Cần thêm
một giá trị khác nhau giữa các service → thêm vào file đó, không rẽ nhánh trong `shared/`.

## 4. Layout một module

```text
modules/<context>/
├── <context>.module.ts
├── <context>.di-token.ts
├── domain/
│   ├── entities/                  # aggregate + *.props.ts
│   ├── value-objects/
│   ├── events/
│   ├── exceptions/
│   ├── repositories/              # interface (port) của aggregate
│   └── constants/
├── application/
│   ├── commands/<noun-verb>/      # <x>.command.ts + <x>.command.handler.ts
│   ├── queries/<noun-verb>/       # <x>.query.ts + <x>.query.handler.ts (+ <x>.result.ts)
│   ├── event-handlers/
│   └── ports/                     # interface cho dịch vụ hạ tầng (token, hash, query service…)
├── infrastructure/
│   ├── persistence/               # *.typeorm-entity.ts, *.repository.ts, mappers/
│   ├── seeds/                     # *.seeder.ts (npm run seed:run)
│   ├── services/                  # implement của application/ports
│   ├── config/, scheduler/, cli/
└── presentation/
    ├── http/                      # controllers/, requests/, responses/, constants/
    └── messaging/                 # RabbitMQ subscriber + consumer constants
```

Chỉ tạo thư mục khi có file; không giữ thư mục rỗng bằng `.gitkeep`.

### Quy ước đặt tên use case

`<noun>-<verb>[-<qualifier>]`: aggregate trước, hành động sau. Áp dụng cho thư mục, tên
file và tên class, để các use case của cùng một aggregate nằm cạnh nhau khi sắp xếp:

| Thư mục | Class |
|---|---|
| `commands/sample-create/` | `SampleCreateCommand`, `SampleCreateCommandHandler` |
| `queries/sample-get-by-id/` | `SampleGetByIdQuery`, `SampleGetByIdQueryHandler` |
| `commands/password-reset-request/` | `PasswordResetRequestCommand` |

Request/response DTO theo cùng quy ước: `requests/sample-create.request.dto.ts` →
`SampleCreateRequestDto`, `responses/sample.response.dto.ts` → `SampleResponseDto`. Bảng đầy đủ
ở skill `be-naming` (`.agents/skills/be-naming/SKILL.md`).

### Import

- Cùng một module (hoặc cùng một tầng của `shared/`): import tương đối (`../../domain/...`).
- Khác module / khác tầng: import tuyệt đối theo `baseUrl: ./src` (`shared/...`, `modules/...`,
  `config/...`). Nest CLI tự đổi thành đường dẫn tương đối khi build.

## 5. Thêm module mới (vd. `products`)

1. `domain/`: `entities/product.entity.ts` (kế thừa `AggregateRoot` nếu phát event),
   `repositories/product.repository.ts` (kế thừa `BaseRepository<ProductEntity>`),
   `exceptions/` (kế thừa `DomainException`).
2. `products.di-token.ts`: `PRODUCT_DI_TOKEN = { REPOSITORY: Symbol('PRODUCT_REPOSITORY') }`.
3. `infrastructure/persistence/`: `product.typeorm-entity.ts` (kế thừa `AbstractEntity`,
   tên file **phải** kết thúc bằng `.typeorm-entity.ts`; file có `@Entity` đặt sai tên/sai
   thư mục sẽ làm app và CLI dừng ngay khi khởi động với thông báo chỉ rõ file),
   `product.repository.ts`, `mappers/product.mapper.ts`.
4. `application/commands/product-create/`, `application/queries/product-get-by-id/`.
5. `presentation/http/`: controller, `requests/` (`<noun>-<verb>.request.dto.ts`, có `static toCommand`),
   `responses/` (`<noun>.response.dto.ts`, có `static fromDomain`), `constants/` (response code).
6. `products.module.ts` đăng ký provider theo DI token; import vào `app.module.ts`.
7. Migration: `npm run migration:generate -- src/database/migrations/<Name>`.

## 6. Đồng bộ `shared/` sang service khác

`shared/` là bản copy, không phải package. Sửa ở boilerplate trước, rồi:

```bash
# từ thư mục PBL6/
cp -r boilerplate/src/shared/. <Service>/src/shared/
diff -rq --strip-trailing-cr boilerplate/src/shared <Service>/src/shared   # phải rỗng
```

Nếu một service cần hành vi khác, đưa phần khác biệt vào `config/service.constants.ts`
hoặc vào module của service đó (provider override), không sửa `shared/` tại chỗ.

## 7. Kiểm tra dependency rule

Các lệnh sau phải không in ra gì:

```bash
grep -rnE "from '(@nestjs|typeorm|express)" src/shared/domain src/modules/*/domain
grep -rnE "from '[^']*(infrastructure|presentation)" src/shared/domain src/shared/application src/modules/*/domain src/modules/*/application
grep -rnE "from '[^']*application" src/shared/domain src/modules/*/domain
```

Repository của aggregate chỉ kế thừa `BaseRepository` khi thật sự hỗ trợ đủ `save`,
`findById`, `delete`; không viết method `throw new Error('Method not implemented.')`.
Ví dụ `IAuthRepository` (refresh token chỉ revoke, không xoá) tự khai báo method riêng.

## 8. Audit

P11-D92 chọn ghi audit sau khi command handler hoàn tất transaction. Module audit
cung cấp `AuditEntry`, port `AuditRecorder`, decorator, explorer và adapter
`TypeOrmAuditRecorder` ghi vào bảng `audit_logs` trong DB của service đang chạy.
Application chỉ biết port; entity TypeORM và thao tác DB nằm ở infrastructure.

Toàn bộ audit nằm trong một module. Entry và port thuộc application, DI token
đặt ở gốc module theo cấu trúc chung của project:

```text
modules/audit/
├── audit.module.ts
├── audit.di-token.ts
├── application/
│   ├── audit-entry.ts
│   ├── audited.decorator.ts
│   └── ports/
│       └── audit-recorder.port.ts
└── infrastructure/
    ├── audit.explorer.ts
    └── persistence/
        ├── audit-log.typeorm-entity.ts
        └── audit-recorder.ts
```

### Khai báo trên handler

```ts
import { Audited } from 'modules/audit/application/audited.decorator';

@Audited<UserLockCommand, User>({
  action: 'user.locked',
  entityType: 'user',
  actorId: (command) => command.adminId,
  entityId: (command) => command.userId,
  metadata: (command) => ({ lockReason: command.lockReason }),
  skipIf: (_command, result) => result === null,
  onError: 'log',
})
async execute(command: UserLockCommand): Promise<User> {
  // Thực hiện nghiệp vụ và await transaction như bình thường.
}
```

`@Audited` chỉ gắn metadata bằng Reflect. Resolver nhận tham số đầu tiên của
method (command) và kết quả đã await; explorer giữ nguyên `this` và toàn bộ tham
số khi gọi method gốc. `metadata`, `skipIf` và `onError` là tùy chọn.

Handler ném lỗi thì giữ nguyên lỗi và không ghi audit. Sau khi handler thành công,
`skipIf(command, result)` trả `true` thì bỏ qua audit. Nếu không bỏ qua, explorer
await `record(entry)` **không truyền context**. Adapter tự mở transaction riêng;
lỗi audit không thể rollback transaction đã commit của command. Lỗi `record()`
với `onError: 'log'` (mặc định) được log một lần kèm action/entityId và handler vẫn
trả kết quả; `onError: 'throw'` ném lỗi đó ra ngoài. Lỗi resolver/`skipIf` truyền ra
ngoài bình thường; `onError` chỉ áp dụng cho `record()`.

### Import module và lưu DB

Trong boilerplate, `SharedModule` đã import `AuditModule` từ
`modules/audit/audit.module.ts`. App chỉ cần nạp `SharedModule`
để explorer chạy ở `onModuleInit`, không cần import `AuditModule` riêng.
`@Global()` không tự kích hoạt module nếu chưa import. Service chỉ copy các file
audit mà chưa cập nhật wiring vẫn phải import `AuditModule` một lần trong module
được app nạp.

`AuditModule` đăng ký entity qua `TypeOrmModule.forFeature` và bind sẵn
`AUDIT_RECORDER_DI_TOKEN` sang `TypeOrmAuditRecorder`, đồng thời export token đó.
Service sử dụng kết nối PostgreSQL và `UNIT_OF_WORK_DI_TOKEN` có sẵn trong
`SharedModule`, không cần bind recorder thủ công. Phải chạy migration trước khi
ghi audit:

```bash
npm run migration:run
```

Khi `AuditModule` được import, explorer dùng `DiscoveryService` và
`MetadataScanner` tìm method `@Audited` trên provider. Có method audit nhưng chưa
bind `AUDIT_RECORDER_DI_TOKEN` thì explorer dừng khởi động với thông báo chỉ rõ
method và binding còn thiếu. Module hiện đã bind adapter DB mặc định. Khi chưa
gắn `@Audited` lên handler thì không phát sinh bản ghi audit tự động.

`TypeOrmAuditRecorder.record(entry, context?)` dùng repository trong
`TypeOrmTransactionContext` khi có context; khi không có thì mở transaction riêng
bằng `IUnitOfWork.run`. Vì vậy audit truyền context sẽ cùng commit/rollback với
transaction đó, còn audit từ explorer được ghi sau transaction của handler.

Adapter chỉ INSERT, không update hoặc soft-delete. Bảng `audit_logs` có:

- `id` UUID, `action` (tối đa 100 ký tự), `entity_type` (tối đa 50 ký tự).
- `entity_id`, `actor_id`: UUID nullable, không có FK tới bảng riêng của service.
- `metadata`: JSONB nullable; module dùng chung không áp đặt allowlist nghiệp vụ.
- `occurred_at`: thời điểm sự kiện; mặc định thời điểm adapter ghi nếu entry không
  cung cấp. `created_at` là thời điểm lưu bản ghi.
- `source_event_id`: text nullable, có unique index để chống ghi trùng event.
  Ghi lại cùng ID sẽ giữ nguyên bản ghi đầu tiên. Những entry không có ID này
  được ghi riêng từng lần.

Index theo `(entity_type, entity_id, occurred_at)` và `(actor_id, occurred_at)`
phục vụ tra cứu. Entity audit khai báo riêng, không kế thừa `AbstractEntity` vì
audit là dữ liệu append-only và không có `updated_at`/`is_deleted`.

### Mở rộng sau này

- Identity thêm hành động mới bằng cách thêm action vào danh sách và allowlist
  metadata ở phần lưu trữ audit riêng của Identity, rồi gắn `@Audited` lên handler;
  không sửa decorator, explorer hoặc contract dùng chung.
- Service khác có thể bind `OutboxAuditRecorder` để phát `audit.recorded` qua
  transactional outbox thay cho binding adapter DB mặc định; Identity consume
  và lưu như P11-05. Chưa triển khai adapter outbox hoặc consumer này. Cấu hình
  hiện tại lưu audit cục bộ trong DB của từng service, không tập trung về Identity.

Khi đồng bộ cấu trúc này sang service khác:

1. Copy `src/modules/audit/**` và migration
   `src/database/migrations/1795426800901-CreateAuditLogsTable.ts`.
2. Import `AuditModule` trong `SharedModule` hoặc một module được app nạp; giữ
   kết nối TypeORM và binding `UNIT_OF_WORK_DI_TOKEN` hiện có.
3. Chạy `npm run migration:run` trên DB của service đó.
4. Dùng `@Audited` trên method handler cần audit hoặc inject recorder qua
   `AUDIT_RECORDER_DI_TOKEN` khi cần ghi trực tiếp. Decorator import từ
   `modules/audit/application/audited.decorator`, port từ
   `modules/audit/application/ports/audit-recorder.port` và token từ
   `modules/audit/audit.di-token`.

Nếu đang dùng cấu trúc audit cũ trong shared, chuyển toàn bộ import sang module
mới rồi xoá các file audit cũ để chỉ có một DI token và một explorer. Không chép
đè toàn bộ `src/shared/` vì các service hiện có khác biệt ở auth, HTTP và DI token.
