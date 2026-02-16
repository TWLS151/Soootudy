T = int(input())

for tc in range(1, T+1):

    N, K = map(int, input().split()) # N 정원 K 제출 수
    students = set(i for i in range(1, N+1)) # 전체 학생 집합
    checked = set(map(int, input().split())) # 차집합 계산을 위해 set으로 입력

    non_submit = students - checked # 정렬은 특별히 필요 X

    print(f"#{tc}", *non_submit, sep=" ")