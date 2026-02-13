T = int(input())
for tc in range(1, T + 1):  # 테스트 케이스의 개수
    N, M = map(int, input().split())  # 학생 수 N, 문항 수 M
    answer = list(map(int, input().split()))  # M개 문항에 대한 답안
    all_grade = []  # 학생들의 점수를 담을 리스트

    for _ in range(N):
        # 각 학생의 점수를 받는다
        student = list(map(int, input().split()))
        # 총 점수를 담을 변수
        total = 0
        # 처음으로 문제를 맞으면 1점
        grade = 1
        for i in range(M):
            # 답안과 학생의 답이 같으면
            if answer[i] == student[i]:
                # 총 점수에 점수를 담는다
                total += grade
                # 다음 답안도 맞으면 +1을 해야하니 우선 더해둔다
                grade += 1
            # 답안과 학생의 답이 다르면
            else:
                # 다시 점수를 1점으로 초기화한다
                grade = 1
        all_grade.append(total)
    print(f'#{tc} {max(all_grade)-min(all_grade)}')