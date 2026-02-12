T = int(input())

d = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1,0), (1,-1), (0,-1), (-1,-1)] # 8방향 탐색 준비

def orthello(arr, move):

    for c_m, r_m, color in move: # 1. 돌 놓기

        r = r_m-1 # 행 이동 위치
        c = c_m-1 # 열 이동 위치
        arr[r][c] = color # 해당 위치에 돌 놓기

        for dr, dc in d: # 2. 사잇돌 바꾸기 (돌 탐색 w/ 델타)
            is_change = False # 바꾸는 상황 : X로 시작

            nr = r + dr # 8방향 
            nc = c + dc 
            change_list = []

            if (0 <= nr < N
                and 0 <= nc < N  
                and arr[nr][nc] not in (0, color) ): # 2-1. 옳은 범위 내에서 다른 색을 만나면 -> 탐색 시작
                    
                    change_list.append((nr,nc)) # 값을 바꿔줄 리스트에 추가

                    while True: # 2-2.다시 같은 색을 만날 때까지 반복해서 해당 방향으로 전진
                         
                         nr += dr # 해당 방향으로 전진
                         nc += dc 

                         if not (0 <= nr < N and 0 <= nc < N): # 2-3. 범위 체크 - 벗어나면 실패
                           change_list = []
                           break
                        
                         elif arr[nr][nc] == 0: # 2-4. 빈칸을 만나면 - 실패
                              change_list = []
                              break
                               
                         if arr[nr][nc] == color : # 0을 만나면
                              break
                         
                         change_list.append((nr, nc))
                    
                    # 현재 상황 : 다른 색을 만날 때 까지 전진해서 해당 좌표값을 change_list에 넣었음
                    # 3. 다른 색 돌 바꿔주기
                    for cr, cc in change_list:
                         arr[cr][cc] = color

    b_cnt = 0
    w_cnt = 0
    for r in range(N):
         for c in range(N):
              if arr[r][c] == 1:
                   b_cnt += 1
              elif arr[r][c] == 2:
                   w_cnt += 1

    return (b_cnt, w_cnt)

for tc in range(1, T+1):

    N, M = map(int, input().split())

    move = [tuple(map(int, input().split())) for _ in range(M)]

    arr = [[0]*N for _ in range(N)]

    arr[N//2][N//2] = arr[N//2-1][N//2-1] = 2
    arr[N//2][N//2-1] = arr[N//2-1][N//2] = 1

    result = orthello(arr, move)

    print(f"#{tc}", *result, sep=' ')