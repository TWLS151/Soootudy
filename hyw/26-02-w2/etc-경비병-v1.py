T = int(input())
dx = [-1,1,0,0]
dy = [0,0,-1,1]
for test_num in range(1,1+T):
    n = int(input())
    floor_map = []
    for _ in range(n):
        floor_map.append(list(map(int,input().split())))
    can_look = 0
    cnt =1#경비원 본인
    for i in range(n):
        for j in range(n):
            if floor_map[i][j] ==1:
                cnt+=1
            if floor_map[i][j] ==2:# 경비경 찾기
                for delta in range(4): #상하좌우를 돌며
                    for look in range(1,n):        
                        if 0<=i+dx[delta]*look<n and 0<=j+dy[delta]*look<n: #볼수 있는데 까지 보고
                            #범위 안에서 1 나오기 전까지 전부 추가
                            if floor_map[i+dx[delta]*look][j+dy[delta]*look]==1:
                                break
                            else:
                                can_look+=1
    # print(can_look)
    print(f'#{test_num} {n*n - can_look-cnt}')


                        