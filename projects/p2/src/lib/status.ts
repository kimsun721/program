export function courseStatusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "작성중";
    case "REVIEW":
      return "검토중";
    case "PUBLISHED":
      return "공개중";
    case "HIDDEN":
      return "비공개";
    default:
      return status;
  }
}

export function instructorStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "검토 대기";
    case "APPROVED":
      return "승인됨";
    case "REJECTED":
      return "반려됨";
    default:
      return status;
  }
}

export function userStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "활성";
    case "SUSPENDED":
      return "정지";
    case "DELETED":
      return "탈퇴";
    default:
      return status;
  }
}

export function qnaStatusLabel(status: string): string {
  switch (status) {
    case "OPEN":
      return "답변 대기";
    case "ANSWERED":
      return "답변 완료";
    default:
      return status;
  }
}
