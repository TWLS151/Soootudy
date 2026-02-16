T = 10

def find_fin(arr):

    r = 99
    for c in range(100):
        if arr[r][c] == 2:
            return (r, c)

def climbing_ladder(arr, r, c):

    nr, nc = r, c

    while nr > 0:

        if 0 <= (nc-1) < 100 and arr[nr][nc-1] == 1:  # 방향 전환의 핵심 : 해당 방향으로 쭉 이동해야 할 때
            while 0 <= (nc-1) < 100 and arr[nr][nc-1] != 0:  # : 벽을 만날 때까지 왼쪽 이동
                nc -= 1
            else: nr -= 1  # 벽 만났다면 : 위로 한 칸 이동 (무한 좌우반복 방지)

        elif 0 <= (nc+1) < 100 and arr[nr][nc+1] == 1:  # 우측
            while 0 <= (nc+1) < 100 and arr[nr][nc+1] != 0:
                nc += 1
            else: nr -= 1

        else:
            nr -= 1

    current_pos = (nr, nc)

    return current_pos[1] # 최종 이동후 출발점 반환


for _ in range(10):
    tc = int(input())
    arr = [list(map(int, input().split())) for _ in range(100)]

    fin = find_fin(arr)
    result = climbing_ladder(arr, *fin)

    print(f"#{tc} {result}")