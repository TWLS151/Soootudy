T = int(input())
from itertools import combinations

for test_num in range(1,T+1):
    N,M = map(int,input().split())
    flag = []
    answer = 2500
    color_line = []
    color_line.append(['W']*M)
    color_line.append(['B']*M)
    color_line.append(['R']*M)
    for _ in range(N):
        flag.append(list(input()))
    for c in combinations(range(N),3):
        # print(c ,end = ' ')# 이 조건들 대로 깃발 만들고 비교하기
        commited_flag = []
        for i in range(c[0]+1):
            commited_flag.append(color_line[0])
        for i in range(c[2]-c[0]-1):
            commited_flag.append(color_line[1])
        for i in range(N - c[2]):
            commited_flag.append(color_line[2])
        # print(commited_flag)
        #깃발 만들었으니까 전체 비교 연산
        cnt = 0
        
        for i in range(N):
            for j in range(M):
                if commited_flag[i][j] != flag[i][j]:
                    cnt+=1
        if cnt <answer:
            answer = cnt
    print(f'#{test_num} {answer}')