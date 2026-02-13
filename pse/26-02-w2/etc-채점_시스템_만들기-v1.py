T = int(input())

for tc in range(1, T+1):
    N, M = map(int, input().split())
    correct_answer = list(map(int, input().split()))    # 정답 리스트
    student_answer = [list(map(int, input().split())) for _ in range(N)]    # N명의 학생 답안을 2차원 리스트로 저장

    answer = []     # 각 학생의 OX 결과(1, 0)를 저장할 리스트

    # 1) 학생별로 답안 채점하기
    for student in student_answer:
        result = []
        for i in range(M):
            if student[i] == correct_answer[i]:
                result.append(1)    # 맞으면 1
            else:
                result.append(0)    # 틀리면 0
        answer.append(result)       # 한 학생의 OX 결과를 전체 리스트에 추가

    totals = []     # 각 학생의 최종 점수를 저장할 리스트

    # 2) 연속 점수 계산
    for score in answer:
        total = 0   # 한 학생의 총점
        cnt = 0     # 현재 연속으로 맞은 개수 (연속 카운트)

        for n in range(len(score)):
            if score[n] == 1:
                cnt += 1
                total += cnt    # 현재 연속 점수 누적
            else:
                cnt = 0
        totals.append(total)    # 한 학생의 총점 저장
    
    # 3) 최고점과 최저점의 차이 출력
    print(f'#{tc} {max(totals) - min(totals)}')

'''
Docstring for IM_대비_문제.im_채점시스템

알고리즘 해결 흐름
1. 학생별로 답안 채점하기
>> 처음으로 문제 맞으면 +1, 그다음 연속으로 맞으면 앞 문항 점수에 +1 더하기
>> 틀린 경우: 다시 0으로 초기화
2. 각 채점한 답안들을 저장할 리스트 생성
3. 그 리스트 안에서 최고점 - 최저점의 차이 출력하기

'''
