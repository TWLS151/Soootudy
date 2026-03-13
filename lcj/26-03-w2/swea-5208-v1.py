import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

def dfs_bus(idx, charge, count):
    global min_count

    if charge >= min_count:                       # 2. 가지치기 : (종점 X) 충전 수가 더 많다면 최적해 X
        return

    if idx == end:                                # 1. 종점 도달 시
        min_count = min(count, min_count)        # 최소값 검사 후 갱신
        return

    for i in range(charge, 0, -1):                # 3. 제한된 충전 수 만큼

        print(f"현재 충전량 : {charge}")
        print(f"현재 정류장 : {idx}")
        print(f"다음 갈 정류장 : {idx + i}")
        print(f"충전 수 : {count}")
        print("----------------------------------------------------")

        if idx + i > end:                      # 만약 다음 번에 종점 너머를 갈 수 있다면
            dfs_bus(end, charge, count)       # 종점으로 이동

        else:
            dfs_bus(idx + i, charge - i + busstop[idx + i], count + 1)    # 전략 : 가장 멀리 갈 수 있는 경우의 수부터


for tc in range(1, T+1):

    arr = list(map(int, input().split()))
    min_count = float('inf')

    end = arr[0]       # 종착점 인덱스 (종료 조건)
    busstop = [0] + arr[1:] + [0]   # 인덱스용 패딩 + 종착지점

    print(busstop, end)

    dfs_bus(1, busstop[1], 0)   # 첫 번째 정류장은 충전에서 제외

    print(f"#{tc} {min_count}")