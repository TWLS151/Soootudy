# 연속된 정답에 가중치를 부여하여 각 학생의 총점을 구한 뒤,
# 전체 학생 중 최고점과 최저점의 격차를 산출하는 채점 로직


T = int(input())

for tc in range(1, T + 1):
    N, M = map(int, input().split())
    correct_answer = list(map(int, input().split()))
    students_answer = [list(map(int, input().split())) for _ in range(N)]

    students_score = []
    
    # 각 학생별로 순회하며 채점 진행
    for i in range(N):
        score = 0
        sequence_cnt = 0  # 연속 정답일 시 추가되는 점수 카운트
        
        # 문항 수만큼 순회
        for j in range(M):
            # 정답인 경우
            if correct_answer[j] == students_answer[i][j]:
                sequence_cnt += 1
                score += sequence_cnt
            #오답인 경우
            else:
                sequence_cnt = 0  # 연속 점수 초기화
        
        students_score.append(score)

    print(f'#{tc} {max(students_score) - min(students_score)}')