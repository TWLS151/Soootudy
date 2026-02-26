import sys
sys.stdin = open('input.txt.', 'r')

T = int(input()) # Tc


# 선택 - 비선택 방식의 DFS

def dfs(idx, total):

    if total >= B:                      # 1. 성공 여부 판단 - 최소 탑 높이 만족
        result.append(total-B)
        return

    if idx == N:                        # 2-(1) 종료 : 끝까지 왔다면 반환
        return

    if total + sum(arr[idx:]) < B:      # 2-(2) 종료 2: 현재 높이 + 나머지 높이가 최소 높이보다 낮다면
        return


    dfs(idx+1, total + arr[idx])        # 3-(1) 해당 요소를 선택했을 때

    dfs(idx+1, total)                   # 3-(2) 해당 요소를 skip하는 경우


for tc in range(1, T+1):

    N, B = map(int, input().split())        # 점원 수 N, 탑의 최소치 B
    arr = list(map(int, input().split()))   # 점원의 키 arr
    result = []                             # 탑 길이 차이가 저장될 리스트

    dfs(0, 0)                           # DFS 수행

    print(f"#{tc} {min(result)}")