# Kế Hoạch Triển Khai: Quản Lý Tiến Độ Thanh Toán Theo Đợt & Nhắc Nợ Căn Hộ (Giai Đoạn 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống quản lý tiến độ thanh toán căn hộ theo đợt (7 đợt xây dựng, 95% chiết khấu, 4 đợt vay), thuật toán tự động gạch nợ FIFO và cảnh báo quá hạn nợ trực quan.

**Architecture:** Bảng mới `deal_payment_schedules` trong CRM DB liên kết với `deals`. Backend `crm-service` tính toán phân bổ dòng tiền thực thu từ `deal_payments` theo nguyên tắc FIFO (đợt trước đủ tiền mới sang đợt sau) và xác định trạng thái `PAID`, `OVERDUE`, `DUE_SOON`, `PENDING`. Frontend `FE_Estate_System` hiển thị khối tiến độ thanh toán trực quan trong chi tiết hợp đồng và tích hợp chọn mẫu khi chốt cọc.

**Tech Stack:** Java 21, Spring Boot 3.4.3, Spring Data JPA, PostgreSQL, React 19, TypeScript, Ant Design v5, Playwright.

## Global Constraints
- Schema table `deal_payment_schedules` nằm trên CRM DB (`CRM_DB_NAME`).
- Không phá vỡ luồng ghi nhận thanh toán `deal_payments` hiện có.
- Gạch nợ tính toán động theo FIFO: `amountPaid = min(remainingPool, amountDue)`.
- Các file test/log sinh ra phải nằm trong thư mục `logs/` và đã được ignore.

---

### Task 1: Backend `crm-service` — Entity, Repository & DTOs cho `deal_payment_schedules`

**Files:**
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/enums/ScheduleStatus.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/entity/DealPaymentSchedule.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/repository/DealPaymentScheduleRepository.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/PaymentScheduleItemDto.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/SaveDealScheduleRequest.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/DealPaymentScheduleResponse.java`

**Interfaces:**
- Produces: `DealPaymentSchedule` entity, `DealPaymentScheduleRepository.findByDealIdOrderByInstallmentNoAsc(UUID dealId)`.
- Produces: `DealPaymentScheduleResponse(UUID id, UUID dealId, int installmentNo, String name, BigDecimal percentage, BigDecimal amountDue, LocalDate dueDate, String notes, BigDecimal amountPaid, BigDecimal amountRemaining, ScheduleStatus status, Long daysDiff)`.

- [ ] **Step 1: Tạo enum `ScheduleStatus.java`**
  ```java
  package com.estatecrm.crm_service.enums;

  public enum ScheduleStatus {
      PAID,       // Đã thu đủ 100%
      OVERDUE,    // Quá hạn thanh toán (dueDate < today && amountRemaining > 0)
      DUE_SOON,   // Sắp đến hạn (dueDate <= today + 7 && amountRemaining > 0)
      PENDING     // Chưa đến hạn
  }
  ```

- [ ] **Step 2: Tạo Entity `DealPaymentSchedule.java`**
  ```java
  package com.estatecrm.crm_service.entity;

  import jakarta.persistence.*;
  import java.math.BigDecimal;
  import java.time.LocalDate;
  import java.time.LocalDateTime;
  import java.util.UUID;
  import lombok.Getter;
  import lombok.NoArgsConstructor;
  import lombok.Setter;
  import org.hibernate.annotations.Generated;
  import org.hibernate.generator.EventType;

  @Getter
  @Setter
  @NoArgsConstructor
  @Entity
  @Table(name = "deal_payment_schedules")
  public class DealPaymentSchedule {
      @Id
      @GeneratedValue(strategy = GenerationType.UUID)
      private UUID id;

      @Column(name = "deal_id", nullable = false)
      private UUID dealId;

      @Column(name = "installment_no", nullable = false)
      private int installmentNo;

      @Column(nullable = false, length = 150)
      private String name;

      @Column(precision = 5, scale = 2)
      private BigDecimal percentage;

      @Column(name = "amount_due", nullable = false, precision = 15, scale = 2)
      private BigDecimal amountDue;

      @Column(name = "due_date", nullable = false)
      private LocalDate dueDate;

      @Column(columnDefinition = "text")
      private String notes;

      @Generated(event = EventType.INSERT)
      @Column(name = "created_at", nullable = false, updatable = false)
      private LocalDateTime createdAt;

      @Generated(event = {EventType.INSERT, EventType.UPDATE})
      @Column(name = "updated_at", nullable = false)
      private LocalDateTime updatedAt;
  }
  ```

- [ ] **Step 3: Tạo Repository `DealPaymentScheduleRepository.java`**
  ```java
  package com.estatecrm.crm_service.repository;

  import com.estatecrm.crm_service.entity.DealPaymentSchedule;
  import java.util.List;
  import java.util.UUID;
  import org.springframework.data.jpa.repository.JpaRepository;
  import org.springframework.data.jpa.repository.Modifying;
  import org.springframework.data.jpa.repository.Query;

  public interface DealPaymentScheduleRepository extends JpaRepository<DealPaymentSchedule, UUID> {
      List<DealPaymentSchedule> findByDealIdOrderByInstallmentNoAsc(UUID dealId);

      @Modifying
      @Query("delete from DealPaymentSchedule s where s.dealId = :dealId")
      void deleteByDealId(UUID dealId);
  }
  ```

- [ ] **Step 4: Tạo DTOs (`PaymentScheduleItemDto`, `SaveDealScheduleRequest`, `DealPaymentScheduleResponse`)**
  ```java
  package com.estatecrm.crm_service.dto;

  import com.estatecrm.crm_service.enums.ScheduleStatus;
  import java.math.BigDecimal;
  import java.time.LocalDate;
  import java.util.List;
  import java.util.UUID;

  public record PaymentScheduleItemDto(
      int installmentNo,
      String name,
      BigDecimal percentage,
      BigDecimal amountDue,
      LocalDate dueDate,
      String notes
  ) {}

  public record SaveDealScheduleRequest(
      List<PaymentScheduleItemDto> installments
  ) {}

  public record DealPaymentScheduleResponse(
      UUID id,
      UUID dealId,
      int installmentNo,
      String name,
      BigDecimal percentage,
      BigDecimal amountDue,
      LocalDate dueDate,
      String notes,
      BigDecimal amountPaid,
      BigDecimal amountRemaining,
      ScheduleStatus status,
      Long daysDiff
  ) {}
  ```

- [ ] **Step 5: Kiểm tra biên dịch backend**
  Run: `mvn compile -pl services/crm-service -q`
  Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**
  ```bash
  git add services/crm-service/src/main/java/com/estatecrm/crm_service/enums/ScheduleStatus.java services/crm-service/src/main/java/com/estatecrm/crm_service/entity/DealPaymentSchedule.java services/crm-service/src/main/java/com/estatecrm/crm_service/repository/DealPaymentScheduleRepository.java services/crm-service/src/main/java/com/estatecrm/crm_service/dto/*.java
  git commit -m "feat(crm): add DealPaymentSchedule entity, repository and DTOs (Phase 4)"
  ```

---

### Task 2: Backend `crm-service` — Logic Gạch Nợ FIFO, 3 Mẫu Căn Hộ & Controller

**Files:**
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/service/DealPaymentScheduleService.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/controller/DealPaymentScheduleController.java`
- Create: `services/crm-service/src/test/java/com/estatecrm/crm_service/service/DealPaymentScheduleServiceTests.java`

**Interfaces:**
- Consumes: `DealService.requireAccess(dealId, actorId, role)`, `DealPaymentRepository.totalPaidByDealId(dealId)`, `DealPaymentScheduleRepository`.
- Produces: `List<DealPaymentScheduleResponse> getSchedules(UUID dealId, UUID actorId, String role)`
- Produces: `List<DealPaymentScheduleResponse> applyTemplate(UUID dealId, String templateCode, UUID actorId, String role)`
- Produces: `List<DealPaymentScheduleResponse> saveCustomSchedules(UUID dealId, SaveDealScheduleRequest request, UUID actorId, String role)`

- [ ] **Step 1: Viết Unit Tests `DealPaymentScheduleServiceTests.java` (TDD)**
  - Test `applyTemplate_construction7_generatesCorrectInstallments`
  - Test `fifoCalculation_allocatesPaidAmountAcrossInstallments`
  - Test `statusCalculation_identifiesOverdueAndDueSoon`

- [ ] **Step 2: Chạy test để xác nhận FAIL (chưa có code Service)**
  Run: `mvn test -pl services/crm-service -Dtest=DealPaymentScheduleServiceTests`
  Expected: FAIL (Cannot find DealPaymentScheduleService)

- [ ] **Step 3: Triển khai `DealPaymentScheduleService.java`**
  - Cung cấp 3 mẫu căn hộ:
    - `TEMPLATE_CONSTRUCTION_7`
    - `TEMPLATE_FAST_DISCOUNT_3`
    - `TEMPLATE_BANK_LOAN_4`
  - Thuật toán phân bổ FIFO `totalPaid` qua các đợt theo thứ tự `installment_no`.
  - Tính toán `daysDiff`: Số ngày quá hạn (nếu `< 0`) hoặc số ngày còn lại (nếu `> 0`).

- [ ] **Step 4: Triển khai `DealPaymentScheduleController.java`**
  - `@GetMapping("/api/deals/{dealId}/schedules")`
  - `@PostMapping("/api/deals/{dealId}/schedules")`
  - `@PostMapping("/api/deals/{dealId}/schedules/apply-template")`

- [ ] **Step 5: Chạy test để xác nhận PASS 100%**
  Run: `mvn test -pl services/crm-service -Dtest=DealPaymentScheduleServiceTests`
  Expected: Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 (BUILD SUCCESS)

- [ ] **Step 6: Commit**
  ```bash
  git add services/crm-service/src/main/java/com/estatecrm/crm_service/service/DealPaymentScheduleService.java services/crm-service/src/main/java/com/estatecrm/crm_service/controller/DealPaymentScheduleController.java services/crm-service/src/test/java/com/estatecrm/crm_service/service/DealPaymentScheduleServiceTests.java
  git commit -m "feat(crm): implement payment schedule FIFO allocation and apartment templates"
  ```

---

### Task 3: Frontend `FE_Estate_System` — API Client & Hooks cho Tiến Độ Thanh Toán

**Files:**
- Modify: `src/features/deals/api.ts`

**Interfaces:**
- Produces: `type ScheduleStatus = 'PAID' | 'OVERDUE' | 'DUE_SOON' | 'PENDING'`
- Produces: `interface DealPaymentSchedule`
- Produces: `useDealPaymentSchedules(dealId: string | undefined)`
- Produces: `useApplyScheduleTemplate()`
- Produces: `useSaveDealSchedule()`

- [ ] **Step 1: Khai báo types và hooks trong `src/features/deals/api.ts`**
  ```typescript
  export type ScheduleStatus = 'PAID' | 'OVERDUE' | 'DUE_SOON' | 'PENDING'

  export interface DealPaymentSchedule {
    id: string
    dealId: string
    installmentNo: number
    name: string
    percentage?: number
    amountDue: number
    dueDate: string
    notes?: string
    amountPaid: number
    amountRemaining: number
    status: ScheduleStatus
    daysDiff?: number
  }

  export function useDealPaymentSchedules(dealId?: string) { ... }
  ```

- [ ] **Step 2: Kiểm tra biên dịch TypeScript**
  Run: `cmd.exe /c npx tsc --noEmit`
  Expected: Clean, no errors.

- [ ] **Step 3: Commit**
  ```bash
  git add src/features/deals/api.ts
  git commit -m "feat(deals): add payment schedules API types and React Query hooks"
  ```

---

### Task 4: Frontend `FE_Estate_System` — Component Tiến Độ Thanh Toán & Nhắc Nợ

**Files:**
- Create: `src/features/deals/components/DealPaymentScheduleSection.tsx`
- Create: `src/features/deals/components/DealPaymentScheduleSection.css`
- Modify: `src/features/deals/components/DealDetailDrawer.tsx`
- Modify: `src/features/deals/pages/DealDetailPage.tsx`

**Interfaces:**
- Consumes: `useDealPaymentSchedules(deal.id)`, `useApplyScheduleTemplate()`, `deal.contractValue`.
- Features:
  - Bảng danh sách đợt: Đợt #, Tên mốc, %, Số tiền phải nộp, Hạn chót, Đã thu (FIFO), Còn thiếu, Trạng thái pill.
  - Tag pill trực quan: `Đã thu` (Xanh), `Quá hạn X ngày` (Đỏ cảnh báo), `Còn X ngày` (Cam vàng), `Chưa đến hạn` (Xám).
  - Nút "Áp dụng mẫu căn hộ BĐS": Modal chọn nhanh 1 trong 3 mẫu chuẩn.
  - Tự động đồng bộ gạch nợ ngay khi nộp tiền từ `PaymentModal`.

- [ ] **Step 1: Viết `DealPaymentScheduleSection.tsx` và `DealPaymentScheduleSection.css`**
- [ ] **Step 2: Tích hợp vào `DealDetailDrawer.tsx` và `DealDetailPage.tsx`**
- [ ] **Step 3: Kiểm tra build frontend**
  Run: `cmd.exe /c npm run build`
  Expected: Build thành công (exit 0).

- [ ] **Step 4: Commit**
  ```bash
  git add src/features/deals/components/DealPaymentScheduleSection.tsx src/features/deals/components/DealPaymentScheduleSection.css src/features/deals/components/DealDetailDrawer.tsx src/features/deals/pages/DealDetailPage.tsx
  git commit -m "feat(deals): add visual apartment payment schedule section and template selector"
  ```

---

### Task 5: Frontend `FE_Estate_System` — Tích Hợp Chọn Mẫu Tiến Độ Khi Chốt Cọc

**Files:**
- Modify: `src/features/deals/pages/DealsPage.tsx` / `DealModal.tsx`

**Interfaces:**
- Consumes: Khi tạo Hợp đồng mới từ Bảng hàng Matrix (`action=create`), hiển thị ô chọn `Mẫu tiến độ thanh toán căn hộ`.
- Khi submit tạo Deal thành công: Tự động gọi `applyTemplate` tạo trước danh sách các đợt nộp tiền.

- [ ] **Step 1: Bổ sung trường chọn Mẫu tiến độ thanh toán vào modal tạo hợp đồng**
- [ ] **Step 2: Sau khi tạo hợp đồng thành công, tự động gọi API sinh tiến độ theo mẫu đã chọn**
- [ ] **Step 3: Kiểm tra biên dịch frontend**
  Run: `cmd.exe /c npm run build`
  Expected: Build thành công.

- [ ] **Step 4: Commit**
  ```bash
  git add src/features/deals/pages/DealsPage.tsx src/features/deals/components/DealModal.tsx
  git commit -m "feat(deals): auto-apply payment schedule template when creating deal from matrix lock"
  ```

---

### Task 6: Kiểm Thử Toàn Diện E2E Bằng Playwright

**Files:**
- Create: `logs/audit-phase4-schedule.cjs`

**Verification Flow:**
1. Mở trang Quản lý hợp đồng (`/deals`).
2. Mở chi tiết Hợp đồng căn hộ `RL-A201` $\rightarrow$ Áp dụng Mẫu tiến độ xây dựng 7 đợt.
3. Kiểm tra hiển thị bảng đợt: Đợt 1 cọc (100.000.000 đ) đã xanh `PAID`, Đợt 2 hiển thị đúng hạn và số tiền.
4. Ghi nhận thanh toán Đợt 2 (500.000.000 đ) $\rightarrow$ Hệ thống gạch nợ FIFO, Đợt 2 chuyển sang `PAID`.
5. Chụp ảnh minh chứng lưu vào thư mục `brain/.../audit_phase4_schedule_*.png`.

- [ ] **Step 1: Viết kịch bản test `logs/audit-phase4-schedule.cjs`**
- [ ] **Step 2: Chạy kịch bản test Playwright**
  Run: `node logs/audit-phase4-schedule.cjs`
  Expected: 5/5 bước kiểm thử PASS 100%.

- [ ] **Step 3: Đánh giá ảnh chụp màn hình và nghiệm thu**
- [ ] **Step 4: Commit và hoàn tất**
  ```bash
  git add logs/audit-phase4-schedule.cjs
  git commit -m "test(deals): add Playwright E2E audit for apartment payment schedule and FIFO clearance"
  ```
