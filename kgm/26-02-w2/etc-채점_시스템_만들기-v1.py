for tc in range(1,1+T):
    N, M = map(int, input().split())
    answer = list(map(int,input().split()))
    test = [list(map(int,input().split())) for _ in range(N)]

    stack = [0]                 # 늘어나는 점수를 저장하기 위한 스택
    result = []                 # 학생의 총 점수를 저장하기 위한 result
    for i in range(N):
        temp = 0                # 임시로 점수를 저장할 temp
        # 만약 정답을 맞췄다면 stack을 pop 해서 score에 저장 score+1을 한 후
        # temp와 stack에 저장
        for z in range(M):
            if test[i][z] == answer[z]:
                score = stack.pop()
                score += 1
                temp += score
                stack.append(score)
        # 만약 정답이 아닐 경우 stack을 0으로 초기화
            else:
                score = stack.pop()
                stack.append(0)
        result.append(temp)     # 모든 정답을 비교했으면 점수를 result에 저장

    print(f'#{tc} {max(result)-min(result)}')