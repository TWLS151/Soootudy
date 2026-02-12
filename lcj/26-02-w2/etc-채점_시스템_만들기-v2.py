T = int(input())

def grading(N, M):

    score_list = [] # 모든 학생의 점수 리스트

    for _ in range(N):                           # 각 학생에 대해
        submit = list(map(int, input().split())) # 제출 답안 입력
        score = 0                                # 문항 별 점수
        total = 0                                # 총 점수

        for idx in range(M):                     # 답안을 순회
            if submit[idx] == correct[idx]:      # 정답이면
                score += 1                       # +1 점
                total += score                   # 총점에 문항 별 점수를 추가

            else:                                # 오답이면
                score = 0                        # 문항 별 점수 초기화

        else: score_list.append(total)           # 채점이 끝났다면, 점수를 입력

    else: return max(score_list) - min(score_list) # 결과값 출력


for tc in range(1, T+1):

    N, M = map(int,input().split()) # N 학생 수 M 문항 수
    correct = list(map(int, input().split())) # 정답 리스트
    result = grading(N, M)

    print(f"#{tc} {result}")