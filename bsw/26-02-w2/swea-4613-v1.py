T = int(input())
for tc in range(1, T+ 1):
    N, M = map(int, input().split())
    arr = [input() for _ in range(N)]
    min_count = N * M 
    # 최솟값을 미리 나올수 있는 최대인 N * M 으로 설정
    for i in range(N - 2): # i는 흰색과 파란색의 경계
        for j in range(i + 1, N - 1): # j는 파란색과 빨간색의 경계
            count = 0
            for r in range(0, i + 1): # 처음부터 i까지
                count += M - arr[r].count('W') 
                # 가로줄의 길이인 M에서 W가 기록된 것만 뺌. 나머지도 똑같이
            for r in range(i + 1, j + 1): # i + 1부터 j까지
                count += M - arr[r].count('B')
            for r in range(j + 1, N): # j + 1부터 끝까지
                count += M - arr[r].count('R')
            if min_count > count:
                min_count = count
            # 최솟값이 있으면 그걸로 대체
    print(f'#{tc} {min_count}')