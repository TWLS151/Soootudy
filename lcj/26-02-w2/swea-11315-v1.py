T = int(input()) # tc

'''
# 문제 조건
1. N x N의 오목판에서 세로, 가로, 대각선으로 5개 돌이 연속한 부분을 찾기
2. 있다면 YES, 아니면 NO

# 문제 접근 

N = 5로 고정이 아니니까, 델타로 찾아야 함

1. 행 우선 순회를 하다가 돌 발견 시, (0,1), (1,0), (1,-1), (1, 1) 세 방향을 추가로 탐색 
2. 돌이 있으면 d + 1 해서 유효한 범위면 cnt = 1 -> 순회 계속 진행
3. cnt == 5 -> return YES
'''

## 비상!!! 구글에 찾은 오목은 게임 오목이 아니라 오목하다의 오목이었음...

d = [(0, 1), (1, 1), (1, 0), (1, -1)]# 가로(우), 우하, 세로(하), 좌하 순 탐색

def find_concave(arr):

    is_concave = False

    for r in range(N):             # 오목 검사
        for c in range(N): # 이어진 5개를 검사할 수 있는 범위에서만
            if arr[r][c] == 'o':   # 돌 발견 시 -> 델타 탐색

                for dr, dc in d: # 시계방향 탐색
                    cnt = 1 # 돌 1개

                    for p in range(1, 5): # 탐색할 거리
                        nr = r + dr*p
                        nc = c + dc*p

                        if 0 <= nr < N and 0 <= nc < N and arr[nr][nc] == 'o': # 유효한 범위 내에 돌일때
                            cnt += 1
                        else: break # 다음 방향으로

                    if cnt >= 5:
                        is_concave = True
                        return is_concave


for tc in range(1, T+1):

    N = int(input()) # N x N 크기의 오목판
    arr = [list(input()) for _ in range(N)] # 오목 판 불러오기

    result = find_concave(arr)

    if result:
        print(f"#{tc} YES")
    else: print(f"#{tc} NO")


